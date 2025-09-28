
"use client";

import { useBuilder } from "@/hooks/use-builder";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Download, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";

export function TemplatesSidebar() {
  const { activeForm, dispatch } = useBuilder();
  const versions = activeForm?.versions || [];
  
  const publishedVersions = versions.filter(v => v.type === 'published');
  const totalPublishedCount = publishedVersions.length;

  const handleLoadVersion = (e: React.MouseEvent, versionId: string) => {
    e.stopPropagation();
    dispatch({ type: "LOAD_VERSION", payload: { versionId } });
  };

  const handleDeleteVersion = (e: React.MouseEvent, versionId: string) => {
    e.stopPropagation();
    // Prevent deleting the very last version
    if (versions.length <= 1) {
      alert("You cannot delete the only version of this form.");
      return;
    }
    dispatch({ type: "DELETE_VERSION", payload: { versionId } });
  };

  return (
    <div className="w-full p-4 h-full overflow-y-auto">
      {versions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No templates saved yet. Click 'Save Draft' or 'Publish' to create one.
        </p>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {versions.map((version) => {
            const isPublished = version.type === 'published';
            let versionNumberText = '';
            if (isPublished) {
              const publishedIndex = publishedVersions.findIndex(v => v.id === version.id);
              const versionNumber = totalPublishedCount - publishedIndex;
              versionNumberText = `v${versionNumber}`;
            }

            return (
              <AccordionItem value={version.id} key={version.id} className="border-b-0">
                  <Card>
                      <AccordionTrigger className="p-2 w-full hover:no-underline">
                          <div className="flex justify-between items-center w-full">
                              <div className="flex-1 flex items-center gap-2 text-left">
                                  <CardTitle className="text-sm font-medium leading-tight">{version.name}</CardTitle>
                                  {isPublished && <span className="text-xs text-muted-foreground">{versionNumberText}</span>}
                                  <Badge
                                      className={cn(
                                      "text-xs",
                                      isPublished
                                          ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-100/80"
                                          : ""
                                      )}
                                      variant={
                                      isPublished ? "outline" : "secondary"
                                      }
                                  >
                                      {version.type}
                                  </Badge>
                              </div>
                              <div className="flex gap-1 ml-2">
                                  <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      onClick={(e) => handleLoadVersion(e, version.id)}
                                  >
                                      <Download className="h-4 w-4" />
                                  </Button>
                                  <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 hover:bg-destructive/10"
                                      onClick={(e) => handleDeleteVersion(e, version.id)}
                                      disabled={versions.length <= 1}
                                  >
                                      <Trash className="h-4 w-4 text-destructive" />
                                  </Button>
                              </div>
                          </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-2 pb-2">
                           <CardDescription className="text-xs mb-2">
                              {format(new Date(version.timestamp), "PPP p")}
                          </CardDescription>
                          <p className="text-xs text-muted-foreground">
                              {version.description || "No description."}
                          </p>
                      </AccordionContent>
                  </Card>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}
    </div>
  );
}

