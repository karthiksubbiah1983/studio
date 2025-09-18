"use client";

import { Button } from "@/components/ui/button";
import { useBuilder } from "@/hooks/use-builder";
import { Download } from "lucide-react";

export function Header() {
  const { state } = useBuilder();

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
    <header className="flex items-center justify-between p-2 border-b bg-card shadow-sm">
      <h1 className="text-xl font-bold text-primary font-headline">FormForge</h1>
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="mr-2 h-4 w-4" />
        Export JSON
      </Button>
    </header>
  );
}
