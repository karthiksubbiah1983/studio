

"use client";

import { useBuilder } from "@/hooks/use-builder";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormElementRenderer } from "./form-element";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { FormElementInstance, Section, Workflow, WorkflowAction, Rule, Configuration } from "@/lib/types";
import { cn, getAllElements } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { evaluateRule } from "./form-preview-helpers";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Zap } from "lucide-react";
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
  rules: Rule[];
  configurations: Configuration[];
};

const SectionRenderer = ({ section, formState, updateFormState, rules, configurations }: SectionRendererProps) => {

    const isVisible = useMemo(() => {
        let visible = !section.hidden;
        const showRules = rules.filter(rule => rule?.behaviors?.some(b => b.type === 'show' && b.targetElementId === section.id));
        const hideRules = rules.filter(rule => rule?.behaviors?.some(b => b.type === 'hide' && b.targetElementId === section.id));

        if (showRules.length > 0) {
            visible = showRules.some(r => evaluateRule(r, formState || {}, configurations, [section]));
        }

        if (visible && hideRules.length > 0) {
            if (hideRules.some(r => evaluateRule(r, formState || {}, configurations, [section]))) {
                visible = false;
            }
        }
        return visible;
    }, [section, formState, rules, configurations]);


    const renderElements = (elements: FormElementInstance[], isParentHorizontal?: boolean) => {
        return elements.map(element => (
            <FormElementRenderer
                key={element.id}
                element={element}
                value={formState[element.id]?.value}
                onValueChange={updateFormState}
                formState={formState}
                isParentHorizontal={isParentHorizontal}
                rules={rules}
                configurations={configurations}
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
  rules: Rule[];
  configurations: Configuration[];
  taskId?: string;
  initialState?: { [key: string]: any };
  onSubmit?: (state: { [key: string]: any }) => void;
  submitButtonText?: string;
};

export function FormPreview({ showSubmitButton = true, sections, rules, configurations, taskId, initialState, onSubmit, submitButtonText = "Submit Form" }: FormPreviewProps) {
  const builderContext = useBuilder();
  const router = useRouter();
  const { toast } = useToast();
  const [submissionJson, setSubmissionJson] = useState<string | null>(null);

  const isControlled = initialState !== undefined;
  
  const getInitialState = useCallback(() => {
    const state: { [key: string]: any } = {};
    const allElements = getAllElements(sections);
    allElements.forEach(element => {
        state[element.id] = { 
            value: 'defaultValue' in element ? element.defaultValue : undefined, 
            fullObject: undefined, 
        };
    });
    return state;
  }, [sections]);

  const [localFormState, setLocalFormState] = useState(() => {
    const state = isControlled ? (initialState || {}) : getInitialState();
    // Run initial visibility calculation
    const allElements = getAllElements(sections);
    allElements.forEach(el => {
        const isVisible = !rules.some(rule => 
            rule.behaviors.some(b => b.type === 'hide' && b.targetElementId === el.id) &&
            evaluateRule(rule, state, configurations, sections)
        ) && (rules.filter(rule => rule.behaviors.some(b => b.type === 'show' && b.targetElementId === el.id)).length > 0 ?
            rules.filter(rule => rule.behaviors.some(b => b.type === 'show' && b.targetElementId === el.id)).some(r => evaluateRule(r, state, configurations, sections)) 
            : !el.hidden
        );
        state[el.id] = { ...(state[el.id] || {}), isVisible };
    });
    return state;
  });

  // Re-initialize state if sections change (e.g. loading a new form version)
  useEffect(() => {
    if (!isControlled) {
        setLocalFormState(getInitialState());
    }
  }, [sections, getInitialState, isControlled]);


  // Reactive rule engine for the preview
  useEffect(() => {
    const allElements = getAllElements(sections);
    
    const getElementVisibility = (element: FormElementInstance, formState: any, rowContext?: any): boolean => {
        const context = rowContext ? { ...formState, ...rowContext } : formState;
        
        const hideRuleMet = rules.some(rule => 
            rule?.behaviors?.some(b => b.type === 'hide' && b.targetElementId === element.id) && 
            evaluateRule(rule, context, configurations, sections, rowContext)
        );
        if (hideRuleMet) return false;

        const showRules = rules.filter(rule => rule?.behaviors?.some(b => b.type === 'show' && b.targetElementId === element.id));
        if (showRules.length > 0) {
            return showRules.some(r => evaluateRule(r, context, configurations, sections, rowContext));
        }

        return !element.hidden;
    };
    
    const nextFormState = { ...localFormState };
    let stateChanged = false;

    allElements.forEach(element => {
      const isVisible = getElementVisibility(element, localFormState);
      const currentVisibility = nextFormState[element.id]?.isVisible;
      
      if (currentVisibility !== isVisible) {
        if (!nextFormState[element.id]) {
          nextFormState[element.id] = { value: undefined, isVisible: isVisible };
        } else {
          nextFormState[element.id] = { ...nextFormState[element.id], isVisible: isVisible };
        }
        stateChanged = true;
      }
    });

    if (stateChanged) {
      // Use functional update to avoid stale state issues in rapid succession
      setLocalFormState(currentState => {
        const finalState = { ...currentState };
        allElements.forEach(element => {
            const isVisible = getElementVisibility(element, currentState);
            if (finalState[element.id]) {
                finalState[element.id].isVisible = isVisible;
            } else {
                finalState[element.id] = { value: undefined, isVisible: isVisible };
            }
        });
        return finalState;
      });
    }
  }, [localFormState, sections, rules, configurations]);


  const isControlledRef = useRef(isControlled);
  isControlledRef.current = isControlled;
  const onSubmitRef = useRef(onSubmit);
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  const updateFormState = useCallback((elementId: string, value: any, fullObject?: any) => {
    setLocalFormState(prev => {
        const newState = {
            ...prev,
            [elementId]: { ...(prev[elementId] || {}), value, fullObject },
        };

        if (isControlledRef.current && onSubmitRef.current) {
            onSubmitRef.current(newState);
        }
        return newState;
    });
  }, []);


  const processWorkflows = (submissionData: Record<string, any>) => {
    const { workflows, configurations: globalConfigurations, dispatch } = builderContext;
    if (!workflows || workflows.length === 0) return;

    for (const workflow of workflows) {
        const stateForEval: { [key: string]: { value: any } } = {};
        const allElements = getAllElements(sections);
        allElements.forEach(el => {
            if ('key' in el && el.key) {
                stateForEval[el.id] = { value: submissionData[el.key] };
            }
        })
        
        const isTriggered = evaluateRule(workflow, stateForEval, globalConfigurations, sections);

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
            rules={rules}
            configurations={configurations}
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

    