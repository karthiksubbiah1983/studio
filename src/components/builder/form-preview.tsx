

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
  const { activeForm, sections, dispatch } = useBuilder();
  const [formState, setFormState] = useState<{ [key: string]: { value: any, fullObject?: any } }>({});
  const { toast } = useToast();
  
  const latestVersion = activeForm?.versions[0];
  const publishedVersionsCount = activeForm?.versions.filter(v => v.type === 'published').length || 0;

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

 const elementVisibility = useMemo(() => {
    const visibility: { [key: string]: boolean } = {};
    const allElementsAndSections = [...sections, ...getAllElements(sections)];

    allElementsAndSections.forEach(item => {
        visibility[item.id] = true; // Default to visible
    });

    allElementsAndSections.forEach(item => {
        if (item.rules) {
            const showRules = item.rules.filter(rule => rule.behavior.type === 'show');
            const hideRules = item.rules.filter(rule => rule.behavior.type === 'hide');

            let isVisible = true;
            
            // If there are 'show' rules, element is hidden by default unless a 'show' rule is met
            if (showRules.length > 0) {
                isVisible = false;
                for (const rule of showRules) {
                    if (evaluateRule(rule, formState)) {
                        isVisible = true;
                        break;
                    }
                }
            }

            // 'hide' rules can override 'show' rules
            for (const rule of hideRules) {
                if (evaluateRule(rule, formState)) {
                    isVisible = false;
                    break;
                }
            }
            visibility[item.id] = isVisible;
        }
    });

    return visibility;
 }, [formState, sections]);

 const evaluateRule = (rule: Rule, state: typeof formState) => {
     const sourceValue = state[rule.condition.sourceElementId]?.value;
     const conditionValue = rule.condition.value;

     if (sourceValue === undefined) return false;

     switch (rule.condition.operator) {
        case 'equals': return String(sourceValue) === conditionValue;
        case 'not_equals': return String(sourceValue) !== conditionValue;
        case 'contains': return String(sourceValue).includes(conditionValue);
        case 'not_contains': return !String(sourceValue).includes(conditionValue);
        case 'is_greater_than': return Number(sourceValue) > Number(conditionValue);
        case 'is_less_than': return Number(sourceValue) < Number(conditionValue);
        default: return false;
     }
 }
  
  const renderElements = (elements: FormElementInstance[], isParentHorizontal?: boolean) => {
    return elements.map((element) => {
      if (!elementVisibility[element.id]) return null;

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
         if (!elementVisibility[section.id]) return null;

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
