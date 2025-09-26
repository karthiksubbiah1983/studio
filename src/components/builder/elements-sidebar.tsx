
"use client";

import { FormElements } from "@/lib/form-elements";
import { SidebarElement } from "./sidebar-element";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function ElementsSidebar() {
  return (
    <aside className="w-full md:w-56 p-2 bg-card overflow-y-auto h-full">
      <Accordion type="multiple" defaultValue={['basic-components']} className="w-full">
        <AccordionItem value="basic-components">
          <AccordionTrigger className="px-2 hover:no-underline text-sm">Basic Components</AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="grid grid-cols-2 gap-2 px-2">
              {FormElements.map((element) => (
                <SidebarElement key={element.type} element={element} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="functional-components">
          <AccordionTrigger className="px-2 hover:no-underline text-sm">Functional Component</AccordionTrigger>
          <AccordionContent>
            <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
              No functional components yet.
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </aside>
  );
}
