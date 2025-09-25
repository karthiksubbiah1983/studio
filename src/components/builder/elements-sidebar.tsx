
"use client";

import { FormElements } from "@/lib/form-elements";
import { SidebarElement } from "./sidebar-element";

export function ElementsSidebar() {
  return (
    <aside className="w-full md:w-56 p-4 bg-card overflow-y-auto h-full">
      <p className="text-sm text-foreground/70 mb-4">Drag and drop elements</p>
      <div className="grid grid-cols-2 gap-2">
        {FormElements.map((element) => (
          <SidebarElement key={element.type} element={element} />
        ))}
      </div>
    </aside>
  );
}
