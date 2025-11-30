

"use client";

import { useBuilder } from "@/hooks/use-builder";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormElementRenderer } from "./form-element";
import { useEffect, useMemo, useState } from "react";
import { FormElementInstance, Section, Workflow, WorkflowAction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "../ui/badge";
import { getAllElements, evaluateRule } from "./form-preview-helpers";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Zap } from "lucide-react";

type Props = {
    showSubmitButton?: boolean;
    sections: Section[];
}

const generateSubmissionJson = (elements: (FormElementInstance | Section)[], formState: { [key: string]: any }): Record<string, any> => {
    const submission: Record<string, any> = {};
    elements.forEach(element => {
        if ('key' in element && element.key) {
            submission[element.key] = formState[element.id]?.value;
        }
    });
    return submission;
};

export function FormPreview({ showSubmitButton = true, sections }: Props) {
  const { rules, workflows, dispatch, activeForm } = useBuilder();

  const [formState, setFormState] = useState<{ [key: string]: { value: any, fullObject?: any } }>({});
  const { toast } = useToast();
  
  const handleValueChange = (elementId: string, value: any, fullObject?: any) => {
    setFormState((prev) => ({ ...prev, [elementId]: { value, fullObject } }));
  };

  const processWorkflows = (submissionData: Record<string, any>) => {
    if (!workflows || workflows.length === 0) return;

    for (const workflow of workflows) {
        const stateForEval: { [key: string]: { value: any } } = {};
        const allElements = getAllElements(sections);
        allElements.forEach(el => {
            if ('key' in el && el.key) {
                stateForEval[el.id] = { value: submissionData[el.key] };
            }
        })
        
        const isTriggered = evaluateRule(workflow, stateForEval);

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
    if (!activeForm) return;

    const allElements = getAllElements(sections);
    const submissionData = generateSubmissionJson(allElements, formState);
    
    dispatch({
        type: 'ADD_SUBMISSION',
        payload: {
            formId: activeForm.id,
            data: submissionData,
        }
    });

    processWorkflows(submissionData);
    
    toast({
        title: "Submission Saved!",
        description: (
            <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                <code className="text-white">{JSON.stringify(submissionData, null, 2)}</code>
            </pre>
        )
    });

    setFormState({});
  }

  const renderElements = (elements: FormElementInstance[], isParentHorizontal?: boolean) => {
      return elements.map(element => (
          <FormElementRenderer
              key={element.id}
              element={element}
              value={formState[element.id]?.value}
              onValueChange={handleValueChange}
              formState={formState}
              isParentHorizontal={isParentHorizontal}
          />
      ));
  };

  const isSectionVisible = (section: Section): boolean => {
    const showRules = rules.filter(rule => rule && rule.behaviors && rule.behaviors.some(b => b && b.type === 'show' && b.targetElementId === section.id));
    const hideRules = rules.filter(rule => rule && rule.behaviors && rule.behaviors.some(b => b && b.type === 'hide' && b.targetElementId === section.id));

    let visible = !section.popupOnly;

    if (showRules.length > 0) {
        visible = showRules.some(r => evaluateRule(r, formState || {}));
    }

    if (visible && hideRules.length > 0) {
      if (hideRules.some(r => evaluateRule(r, formState || {}))) {
        visible = false;
      }
    }
    
    return visible;
  }

  const renderSectionContent = (section: Section) => (
    <div className={cn("grid gap-4 grid-cols-1", section.displayMode !== 'accordion' && 'p-6 pt-0')}>
        {renderElements(section.elements)}
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      {sections.map((section) => {
         if (!isSectionVisible(section)) return null;

         if (section.displayMode === 'accordion') {
            return (
                <Accordion type="single" collapsible key={section.id}>
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
      })}
       {showSubmitButton && <div className="flex justify-end mt-8">
            <Button onClick={handleSubmit}>
                Submit Form
            </Button>
        </div>}
    </div>
  );
}
