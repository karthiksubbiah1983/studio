
"use client";

import { useBuilder } from "@/hooks/use-builder";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormElementRenderer } from "./form-element";
import { useEffect, useMemo, useState, useCallback } from "react";
import { FormElementInstance, Section, Workflow, WorkflowAction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { evaluateRule } from "./form-preview-helpers";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Zap } from "lucide-react";
import { getAllElements, findElementRecursive } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";


const generateSubmissionJson = (allElements: (FormElementInstance | Section)[], formState: { [key: string]: any }): Record<string, any> => {
    const submission: Record<string, any> = {};
    allElements.forEach(element => {
        if ('key' in element && element.key) {
            const elementState = formState[element.id];
            if (elementState) {
                 if (element.type === 'FileUpload' && Array.isArray(elementState.value)) {
                    // For FileUpload, serialize the File objects
                    submission[element.key] = elementState.value.map((file: File) => ({
                        name: file.name,
                        size: file.size,
                        type: file.type,
                    }));
                } else if (elementState.fullObject) {
                    submission[element.key] = elementState.fullObject;
                } else {
                    submission[element.key] = elementState.value;
                }
            }
        }
    });
    return submission;
};

type SectionRendererProps = {
  section: Section;
  formState: { [key: string]: any };
  updateFormState: (id: string, value: any, fullObject?: any) => void;
};

const SectionRenderer = ({ section, formState, updateFormState }: SectionRendererProps) => {
    const { rules, configurations, sections } = useBuilder();

    const isVisible = useMemo(() => {
        let visible = !section.hidden;
        const showRules = rules.filter(rule => rule?.behaviors?.some(b => b.type === 'show' && b.targetElementId === section.id));
        const hideRules = rules.filter(rule => rule?.behaviors?.some(b => b.type === 'hide' && b.targetElementId === section.id));

        if (showRules.length > 0) {
            visible = showRules.some(r => evaluateRule(r, formState || {}, configurations, sections));
        }

        if (visible && hideRules.length > 0) {
            if (hideRules.some(r => evaluateRule(r, formState || {}, configurations, sections))) {
                visible = false;
            }
        }
        return visible;
    }, [section, formState, rules, configurations, sections]);


    const renderElements = (elements: FormElementInstance[], isParentHorizontal?: boolean) => {
        return elements.map(element => (
            <FormElementRenderer
                key={element.id}
                element={element}
                value={formState[element.id]?.value}
                onValueChange={updateFormState}
                formState={formState}
                isParentHorizontal={isParentHorizontal}
            />
        ));
    };

    const renderSectionContent = (section: Section) => (
        <div className={cn("grid gap-4 grid-cols-1", section.displayMode !== 'accordion' && 'p-6 pt-0')}>
            {renderElements(section.elements)}
        </div>
    );
    
    if (!isVisible) {
        return null;
    }

    if (section.displayMode === 'accordion') {
        return (
            <Accordion type="single" collapsible defaultValue={section.id} key={section.id}>
                <AccordionItem value={section.id}>
                    <Card>
                        <AccordionTrigger className="w-full p-6 text-base font-medium">
                           {section.title}
                        </AccordionTrigger>
                        <AccordionContent>
                            <CardContent>
                                {renderSectionContent(section)}
                            </CardContent>
                        </AccordionContent>
                    </Card>
                </AccordionItem>
            </Accordion>
        );
    }

    return (
        <Card key={section.id}>
            <CardHeader>
                <CardTitle className="text-base font-medium">
                    {section.title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {renderSectionContent(section)}
            </CardContent>
        </Card>
    );
}

type FormPreviewProps = {
  showSubmitButton?: boolean;
  sections: Section[];
  taskId?: string;
  initialState?: { [key: string]: any };
  onSubmit?: (state: { [key: string]: any }) => void;
  submitButtonText?: string;
};

export function FormPreview({ showSubmitButton = true, sections, taskId, initialState, onSubmit, submitButtonText = "Submit Form" }: FormPreviewProps) {
  const builderContext = useBuilder();
  const router = useRouter();
  const { toast } = useToast();
  const [submissionJson, setSubmissionJson] = useState<string | null>(null);

  const isControlled = initialState !== undefined;
  
  const getInitialState = useCallback(() => {
    const state: { [key: string]: any } = {};
    const allElements = getAllElements(sections);
    allElements.forEach(element => {
        if ('defaultValue' in element && element.defaultValue !== undefined) {
             state[element.id] = { value: element.defaultValue, fullObject: undefined, isVisible: !element.hidden };
        }
    });
    return state;
  }, [sections]);

  // Use a local state for the preview, initialized correctly
  const [localFormState, setLocalFormState] = useState(() => {
    if (isControlled) {
      return initialState || {};
    }
    const defaultState = getInitialState();
    // Merge the global builder state on top of the default state
    return { ...defaultState, ...builderContext.formState };
  });

  // Re-initialize state if the sections change (e.g., loading a different form/version)
  useEffect(() => {
    if (!isControlled) {
      const defaultState = getInitialState();
      setLocalFormState({ ...defaultState, ...builderContext.formState });
    }
  }, [sections, getInitialState, builderContext.formState, isControlled]);

  const updateFormState = (elementId: string, value: any, fullObject?: any) => {
    const newState = { ...localFormState, [elementId]: { value, fullObject } };
    setLocalFormState(newState);

    if (!isControlled) {
      builderContext.updateFormState(elementId, value, fullObject);
    }
  };


  const processWorkflows = (submissionData: Record<string, any>) => {
    const { workflows, configurations, dispatch } = builderContext;
    if (!workflows || workflows.length === 0) return;

    for (const workflow of workflows) {
        const stateForEval: { [key: string]: { value: any } } = {};
        const allElements = getAllElements(sections);
        allElements.forEach(el => {
            if ('key' in el && el.key) {
                stateForEval[el.id] = { value: submissionData[el.key] };
            }
        })
        
        const isTriggered = evaluateRule(workflow, stateForEval, configurations, sections);

        if (isTriggered) {
             for (const action of workflow.actions) {
                const { type, payload } = action;
                let toastTitle = '';
                let toastDescription = '';
                
                if (type === 'CREATE_TASK') {
                    const taskType = payload.taskType;
                    toastTitle = `Workflow: Create Task`;
                    toastDescription = `A new task was created with type "${taskType}"`;
                } else if (type === 'SET_TASK_STATUS') {
                    toastTitle = `Workflow: Set Task Status to "${payload.status}"`;
                    toastDescription = `The task status was set.`;
                } else if (type === 'CONFIGURE_MAIL') {
                    toastTitle = `Workflow: Mail Sent`;
                    toastDescription = `Sent mail with format: "${payload.mailFormat}"`;
                }
                
                toast({
                    title: <div className="flex items-center gap-2"><Zap className="h-4 w-4" /> {toastTitle}</div>,
                    description: toastDescription,
                });
            }
        }
    }
  }
  
  const handleSubmit = () => {
    const allElements = getAllElements(sections);
    const submissionData = generateSubmissionJson(allElements, localFormState);
    
    setSubmissionJson(JSON.stringify(submissionData, null, 2));

    if (isControlled && onSubmit) {
        onSubmit(localFormState);
        return;
    }

    const { state, activeForm, dispatch } = builderContext;
    const formId = taskId ? state.tasks.find(t => t.id === taskId)?.formId : activeForm?.id;
    if (!formId) return;

    dispatch({
        type: 'ADD_SUBMISSION',
        payload: {
            formId: formId,
            data: submissionData,
            taskId
        }
    });

    processWorkflows(submissionData);
  }

  const handleCloseDialog = () => {
    setSubmissionJson(null);
    if (taskId && !isControlled) {
      router.push('/my-tasks');
    }
  };


  return (
    <div className="p-4 space-y-4">
      {sections.map((section) => (
         <SectionRenderer 
            key={section.id} 
            section={section} 
            formState={localFormState}
            updateFormState={updateFormState}
        />
      ))}
       {showSubmitButton && <div className="flex justify-end mt-8">
            <Button onClick={handleSubmit}>
                {submitButtonText}
            </Button>
        </div>}
         <Dialog open={!!submissionJson} onOpenChange={(open) => !open && handleCloseDialog()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Form Submission JSON</DialogTitle>
                    <DialogDescription>
                        This is the JSON structure of the data that was submitted.
                    </DialogDescription>
                </DialogHeader>
                <pre className="mt-2 max-h-[60vh] overflow-y-auto rounded-md bg-slate-950 p-4">
                    <code className="text-white">{submissionJson}</code>
                </pre>
                <DialogFooter>
                    <Button onClick={handleCloseDialog}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
