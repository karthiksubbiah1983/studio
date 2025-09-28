
"use client";

import { useBuilder } from "@/hooks/use-builder";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { FormElementRenderer } from "./form-element";
import { useState } from "react";
import { FormElementInstance, Section } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";

type Props = {
    showSubmitButton?: boolean;
}

const getAllElements = (sections: Section[]): FormElementInstance[] => {
    let allElements: FormElementInstance[] = [];
    sections.forEach(section => {
        section.elements.forEach(element => {
            allElements.push(element);
            if (element.type === 'Container' && element.elements) {
                // A recursive function to get nested elements
                const getNestedElements = (els: FormElementInstance[]): FormElementInstance[] => {
                    let nested: FormElementInstance[] = [];
                    els.forEach(e => {
                        nested.push(e);
                        if (e.elements) {
                            nested = nested.concat(getNestedElements(e.elements));
                        }
                    });
                    return nested;
                }
                allElements = allElements.concat(getNestedElements(element.elements));
            }
        });
    });
    return allElements;
};

const generateSubmissionJson = (elements: FormElementInstance[], formState: { [key: string]: { value: any } }): Record<string, any> => {
    const submission: Record<string, any> = {};
    elements.forEach(element => {
        if (element.key && formState[element.id]) {
            submission[element.key] = formState[element.id].value;
        }
    });
    return submission;
};

export function FormPreview({ showSubmitButton = true }: Props) {
  const { state, activeForm, sections, dispatch } = useBuilder();
  const [formState, setFormState] = useState<{ [key: string]: { value: any, fullObject?: any } }>({});
  const { toast } = useToast();

  const handleValueChange = (elementId: string, value: any, fullObject?: any) => {
    setFormState((prev) => ({ ...prev, [elementId]: { value, fullObject } }));
  };
  
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
    
    toast({
        title: "Submission Saved!",
        description: (
            <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                <code className="text-white">{JSON.stringify(submissionData, null, 2)}</code>
            </pre>
        )
    });

    // Optionally clear the form after submission
    setFormState({});
  }

  const isVisible = (element: FormElementInstance | Section) => {
    const { conditionalLogic } = element;
    if (!conditionalLogic || !conditionalLogic.enabled || !conditionalLogic.triggerElementId || !conditionalLogic.showWhenValue) {
        return true;
    }
    const triggerValue = formState[conditionalLogic.triggerElementId]?.value;
    
    // For checkbox, triggerValue is boolean
    if (typeof triggerValue === 'boolean') {
        return String(triggerValue) === conditionalLogic.showWhenValue;
    }

    return triggerValue === conditionalLogic.showWhenValue;
  }
  
  const renderElements = (elements: FormElementInstance[], isParentHorizontal?: boolean) => {
    return elements.map((element) => {
      if (!isVisible(element)) return null;

      return (
          <FormElementRenderer
              key={element.id}
              element={element}
              value={formState[element.id]}
              onValueChange={handleValueChange}
              formState={formState}
              isParentHorizontal={isParentHorizontal}
          />
      )
    })
  }

  return (
    <div className="p-4 space-y-8">
      {sections.map((section) => {
         if (!isVisible(section)) return null;

        return (
          <Card key={section.id}>
            <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
                <AccordionItem value="item-1" className="border-b-0">
                    <CardHeader className="p-4 py-2">
                        <AccordionTrigger className="flex-1 hover:no-underline font-medium text-base">
                           {section.title}
                        </AccordionTrigger>
                    </CardHeader>
                    <AccordionContent>
                      <CardContent className="p-4 pt-0">
                        <div
                            className={cn(
                            "grid gap-4 grid-cols-1"
                            )}
                        >
                            {renderElements(section.elements)}
                        </div>
                      </CardContent>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
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
