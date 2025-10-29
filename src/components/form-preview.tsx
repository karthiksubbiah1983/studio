

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
import { FormElementInstance, Section, Rule } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "../ui/badge";
import { getAllElements, evaluateRule } from "./form-preview-helpers";

type Props = {
    showSubmitButton?: boolean;
}

const generateSubmissionJson = (elements: (FormElementInstance | Section)[], formState: { [key: string]: { value: any } }): Record<string, any> => {
    const submission: Record<string, any> = {};
    elements.forEach(element => {
        if ('key' in element && element.key && formState[element.id]) {
            submission[element.key] = formState[element.id].value;
        }
    });
    return submission;
};

export function FormPreview({ showSubmitButton = true }: Props) {
  const { activeForm, sections, rules, dispatch } = useBuilder();
  const [formState, setFormState] = useState<{ [key: string]: { value: any, fullObject?: any } }>({});
  const { toast } = useToast();
  
  const latestVersion = activeForm?.versions[0];

  const handleValueChange = (elementId: string, value: any, fullObject?: any) => {
    setFormState((prev) => ({ ...prev, [elementId]: { value, fullObject } }));
  };
  
  const handleSubmit = () => {
    if (!activeForm) return;

    const allElements = getAllElements(sections, true);
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

    setFormState({});
  }

 const elementVisibility = useMemo(() => {
    const visibility: { [key: string]: boolean } = {};
    const allItems = [...sections, ...getAllElements(sections)];

    // Initialize visibility based on the 'hidden' property
    allItems.forEach(item => {
        visibility[item.id] = !item.hidden;
    });
    
    // Process rules
    rules.forEach(rule => {
        const targetId = rule.behavior.targetElementId;
        if (!targetId || targetId.includes('.')) return; // Skip table cell rules, handled in form-element.tsx

        const isRuleMet = evaluateRule(rule, formState);

        if (rule.behavior.type === 'show' && isRuleMet) {
            visibility[targetId] = true;
        } else if (rule.behavior.type === 'hide' && isRuleMet) {
            visibility[targetId] = false;
        }
    });

    return visibility;
 }, [formState, sections, rules]);

  
  const renderElements = (elements: FormElementInstance[], isParentHorizontal?: boolean) => {
    return elements.map((element) => {
      if (elementVisibility[element.id] === false) return null;

      if (element.type === 'Container') {
        const containerContent = renderElements(element.elements || [], element.direction === 'horizontal');
        const { direction, justify, align } = element;
        const alignmentClasses = {
            justify: {
                start: 'justify-start',
                center: 'justify-center',
                end: 'justify-end',
                between: 'justify-between',
                around: 'justify-around',
                evenly: 'justify-evenly',
            },
            align: {
                start: 'items-start',
                center: 'items-center',
                end: 'items-end',
                stretch: 'items-stretch',
                baseline: 'items-baseline',
            }
        };
        return (
            <div key={element.id} className={cn("flex gap-4",
                direction === 'horizontal' ? 'flex-row' : 'flex-col',
                justify && alignmentClasses.justify[justify],
                align && alignmentClasses.align[align],
            )}>
                {containerContent}
            </div>
        )
      }

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
    <div className="p-4 space-y-4">
      {sections.map((section) => {
         if (visibility[section.id] === false) return null;

        return (
          <Card key={section.id}>
            <CardHeader>
                <CardTitle className="text-base font-medium">
                    {section.title}
                </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                  className={cn(
                  "grid gap-4 grid-cols-1"
                  )}
              >
                  {renderElements(section.elements)}
              </div>
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
