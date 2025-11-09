
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

const generateSubmissionJson = (elements: (FormElementInstance | Section)[], formState: { [key: string]: any }): Record<string, any> => {
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
    const showRules = rules.filter(r => r.behavior.type === 'show' && r.behavior.targetElementId === section.id);
    const hideRules = rules.filter(r => r.behavior.type === 'hide' && r.behavior.targetElementId === section.id);

    let visible;

    if (showRules.length > 0) {
      visible = showRules.some(r => evaluateRule(r, formState || {}));
    } else {
      visible = !section.hidden;
    }

    if (visible && hideRules.length > 0) {
      if (hideRules.some(r => evaluateRule(r, formState || {}))) {
        visible = false;
      }
    }
    
    return visible;
  }

  return (
    <div className="p-4 space-y-4">
      {sections.map((section) => {
         if (!isSectionVisible(section)) return null;

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
    