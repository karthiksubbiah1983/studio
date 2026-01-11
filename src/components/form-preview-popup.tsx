
"use client"

import { useBuilder } from "@/hooks/use-builder";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FormElementInstance, Section } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Button } from "./ui/button";
import { FormElementRenderer } from "./form-element";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  element: FormElementInstance;
  formState: { [key: string]: any };
  onConfirm?: () => void;
};

export function FormPreviewPopup({ 
    isOpen, 
    onOpenChange, 
    element,
    formState, 
    onConfirm
}: Props) {
  const { dispatch, updateFormState } = useBuilder();

  if (element.type !== 'Popup') return null;

  const handleConfirm = () => {
    if(onConfirm) onConfirm();
    onOpenChange(false);
  };
  
  const renderElements = (elements?: FormElementInstance[]) => {
    if (!elements) return null;
    return elements.map(el => (
      <FormElementRenderer
        key={el.id}
        element={el}
        value={formState[el.id]?.value}
        onValueChange={updateFormState}
        formState={formState}
      />
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl flex flex-col p-0 gap-0">
        <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {renderElements(element.elements)}
            </div>
        </div>
        {(element.cancelButtonText || element.confirmButtonText) && (
            <DialogFooter className="p-4 border-t bg-muted/50 rounded-b-lg">
                {element.cancelButtonText && <Button variant="outline" onClick={() => onOpenChange(false)}>{element.cancelButtonText}</Button>}
                {element.confirmButtonText && <Button onClick={handleConfirm}>{element.confirmButtonText}</Button>}
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
