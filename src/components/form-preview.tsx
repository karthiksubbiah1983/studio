
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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { evaluateRule } from "./form-preview-helpers";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Zap } from "lucide-react";
import { getAllElements } from "@/lib/utils";
import { useRouter } from "next/navigation";


type Props = {
    showSubmitButton?: boolean;
    sections: Section[];
    taskId?: string;
}

const generateSubmissionJson = (elements: (FormElementInstance | Section)[], formState: { [key: string]: any }): Record<string, any> => {
    const submission: Record<string, any> = {};
    const allElements = getAllElements(elements as Section[]);
    allElements.forEach(element => {
        if ('key' in element && element.key) {
            submission[element.key] = formState[element.id]?.value;
        }
    });
    return submission;
};

export function FormPreview({ showSubmitButton = true, sections, taskId }: Props) {
  const { rules, workflows, configurations, dispatch, activeForm, state, formState, setFormState, updateFormState } = useBuilder();
  const router = useRouter();
  const { toast } = useToast();

  const handleValueChange = (elementId: string, value: any, fullObject?: any) => {
    updateFormState(elementId, value, fullObject);
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
    const formId = taskId ? state.tasks.find(t => t.id === taskId)?.formId : activeForm?.id;
    if (!formId) return;

    const allElements = getAllElements(sections);
    const submissionData = generateSubmissionJson(allElements, formState);
    
    dispatch({
        type: 'ADD_SUBMISSION',
        payload: {
            formId: formId,
            data: submissionData,
            taskId
        }
    });

    processWorkflows(submissionData);
    
    toast({
        title: "Submission Saved!",
        description: "Your form has been successfully submitted."
    });

    if (taskId) {
        router.push('/my-tasks');
    }
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
    if (!rules) return !section.popupOnly;

    const showRules = rules.filter(rule => rule && rule.behaviors && rule.behaviors.some(b => b && b.type === 'show' && b.targetElementId === section.id));
    const hideRules = rules.filter(rule => rule && rule.behaviors && rule.behaviors.some(b => b && b.type === 'hide' && b.targetElementId === section.id));

    let visible = !section.popupOnly;

    if (showRules.length > 0) {
        visible = showRules.some(r => evaluateRule(r, formState || {}, configurations, sections));
    }

    if (visible && hideRules.length > 0) {
      if (hideRules.some(r => evaluateRule(r, formState || {}, configurations, sections))) {
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
      })}
       {showSubmitButton && <div className="flex justify-end mt-8">
            <Button onClick={handleSubmit}>
                Submit Form
            </Button>
        </div>}
    </div>
  );
}
