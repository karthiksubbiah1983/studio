
"use client"

import { useBuilder } from "@/hooks/use-builder";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FormElementRenderer } from "./form-element";
import { Section } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Button } from "./ui/button";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sectionIds: string[];
  formState: { [key: string]: any };
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm?: () => void;
};

export function FormPreviewPopup({ 
    isOpen, 
    onOpenChange, 
    sectionIds, 
    formState, 
    confirmButtonText, 
    cancelButtonText,
    onConfirm
}: Props) {
  const { sections, dispatch } = useBuilder();

  const sectionsToPreview = sections.filter(s => sectionIds.includes(s.id));

  const handleValueChange = () => {
    // This is a read-only preview, so we don't need to handle value changes.
    // The main form handles state updates.
  };

  const handleConfirm = () => {
    if(onConfirm) onConfirm();
    onOpenChange(false);
  };
  
  const renderSectionContent = (section: Section) => (
    <div className={cn("grid gap-4 grid-cols-1")}>
      {section.elements.map(element => (
        <FormElementRenderer
          key={element.id}
          element={element}
          value={formState[element.id]?.value}
          onValueChange={handleValueChange}
          formState={formState}
        />
      ))}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl flex flex-col">
        <DialogHeader>
          <DialogTitle>Form Preview</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4 border-y">
            <div className="space-y-4">
            {sectionsToPreview.map(section => {
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
                    <CardTitle className="text-base font-medium">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                    {renderSectionContent(section)}
                    </CardContent>
                </Card>
                );
            })}
            </div>
        </div>
        {(cancelButtonText || confirmButtonText) && (
            <DialogFooter>
                {cancelButtonText && <Button variant="outline" onClick={() => onOpenChange(false)}>{cancelButtonText}</Button>}
                {confirmButtonText && <Button onClick={handleConfirm}>{confirmButtonText}</Button>}
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
