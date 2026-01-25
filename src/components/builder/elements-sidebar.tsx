
"use client";

import { BasicFormElements, FunctionalFormElements } from "@/lib/form-elements";
import { SidebarElement } from "./sidebar-element";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";
import { ArrowLeftCircle } from "lucide-react";

export function ElementsSidebar() {
  return (
    <aside className="w-full md:w-[14rem] bg-card overflow-y-auto h-full flex flex-col">
       <div className="p-2">
        <Link
          href="/"
          className="flex items-center gap-2 p-2 rounded-md text-primary transition-colors"
        >
          <ArrowLeftCircle className="h-4 w-4" />
          <span className="font-medium">Back</span>
        </Link>
      </div>
      <div className="flex-grow p-2">
        <Accordion type="multiple" defaultValue={['basic-components', 'functional-components']} className="w-full">
            <AccordionItem value="basic-components">
            <AccordionTrigger className="px-2 py-2 hover:no-underline text-sm">Basic Components</AccordionTrigger>
            <AccordionContent className="pt-4">
                <div className="grid grid-cols-2 gap-2 px-2">
                {BasicFormElements.map((element) => (
                    <SidebarElement key={element.type} element={element} />
                ))}
                </div>
            </AccordionContent>
            </AccordionItem>
            <AccordionItem value="functional-components">
            <AccordionTrigger className="px-2 py-2 hover:no-underline text-sm">Functional Component</AccordionTrigger>
            <AccordionContent className="pt-4">
                <div className="grid grid-cols-2 gap-2 px-2">
                {FunctionalFormElements.map((element) => (
                    <SidebarElement key={element.type} element={element} />
                ))}
                </div>
            </AccordionContent>
            </AccordionItem>
        </Accordion>
      </div>
    </aside>
  );
}
