

"use client";

import { useBuilder } from "@/hooks/use-builder";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { FormPreview } from "@/components/form-preview";
import { Button } from "@/components/ui/button";
import { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Loader2 } from "lucide-react";


type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PreviewDialog({ isOpen, onOpenChange }: Props) {
  const { activeForm, sections, rules, configurations } = useBuilder();
  const [isExporting, setIsExporting] = useState(false);
  const formPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExporting && formPreviewRef.current) {
      html2canvas(formPreviewRef.current, {
        scale: 2,
        useCORS: true,
      }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
        });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        let imgWidth = pdfWidth;
        let imgHeight = imgWidth / ratio;

        if (imgHeight > pdfHeight) {
            imgHeight = pdfHeight;
            imgWidth = imgHeight * ratio;
        }

        const x = (pdfWidth - imgWidth) / 2;
        const y = 0;

        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save(`${activeForm?.title || 'form'}.pdf`);

        setIsExporting(false);
      });
    }
  }, [isExporting, activeForm?.title]);

  const handleExportClick = () => {
    setIsExporting(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            setIsExporting(false);
        }
        onOpenChange(open);
    }}>
      <DialogContent className="w-[80vw] max-w-[80vw] h-screen max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Form Preview</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto min-h-0" ref={formPreviewRef}>
          <FormPreview 
            key={activeForm?.versions[0]?.id}
            sections={sections} 
            rules={rules} 
            configurations={configurations || []}
            showSubmitButton={!isExporting}
            isPdfMode={isExporting}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
          <Button onClick={handleExportClick} disabled={isExporting}>
            {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isExporting ? 'Exporting...' : 'Export to PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
