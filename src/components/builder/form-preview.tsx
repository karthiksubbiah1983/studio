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

export function FormPreview() {
  const { state } = useBuilder();
  const [formState, setFormState] = useState<{ [key: string]: { value: any, fullObject?: any } }>({});

  const handleValueChange = (elementId: string, value: any, fullObject?: any) => {
    setFormState((prev) => ({ ...prev, [elementId]: { value, fullObject } }));
  };

  const isVisible = (element: FormElementInstance | Section) => {
    const { conditionalLogic } = element;
    if (!conditionalLogic || !conditionalLogic.enabled || !conditionalLogic.triggerElementId || !conditionalLogic.showWhenValue) {
        return true;
    }
    const triggerValue = formState[conditionalLogic.triggerElementId]?.value;
    return triggerValue === conditionalLogic.showWhenValue;
  }

  return (
    <div className="p-4 space-y-8">
      {state.sections.map((section) => {
         if (!isVisible(section)) return null;

        return (
          <Card key={section.id}>
            <CardHeader>
              <h3 className="text-lg font-medium">{section.title}</h3>
            </CardHeader>
            <CardContent>
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${section.columns}, 1fr)`,
                }}
              >
                {section.elements.map((element) =>
                  isVisible(element) ? (
                    <FormElementRenderer
                        key={element.id}
                        element={element}
                        value={formState[element.id]}
                        onValueChange={handleValueChange}
                        formState={formState}
                    />
                  ) : null
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
