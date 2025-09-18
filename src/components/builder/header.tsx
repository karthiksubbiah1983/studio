"use client";

import { Button } from "@/components/ui/button";
import { useBuilder } from "@/hooks/use-builder";
import { Download, Eye } from "lucide-react";
import { PreviewDialog } from "./preview-dialog";
import { useState } from "react";

export function Header() {
  const { state } = useBuilder();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleExport = () => {
    const jsonString = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "form-config.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <header className="flex items-center justify-between p-2 border-b bg-card shadow-sm">
        <h1 className="text-xl font-bold text-primary font-headline">FormForge</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </header>
      <PreviewDialog isOpen={isPreviewOpen} onOpenChange={setIsPreviewOpen} />
    </>
  );
}
