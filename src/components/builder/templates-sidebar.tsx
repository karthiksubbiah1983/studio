
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

export function TemplatesSidebar() {
  const { activeForm, dispatch } = useBuilder();
  const versions = activeForm?.versions || [];

  const handleLoadVersion = (versionId: string) => {
    dispatch({ type: "LOAD_VERSION", payload: { versionId } });
  };

  const handleDeleteVersion = (versionId: string) => {
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
        <div className="space-y-4">
          {versions.map((version) => (
            <Card key={version.id}>
              <CardHeader className="p-4">
                <CardTitle className="text-base flex justify-between items-center">
                  {version.name}
                  <Badge
                    className={cn(
                      version.type === "published"
                        ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-100/80"
                        : ""
                    )}
                    variant={
                      version.type === "published" ? "outline" : "secondary"
                    }
                  >
                    {version.type}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {format(new Date(version.timestamp), "PPP p")}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground mb-4">
                  {version.description || "No description."}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleLoadVersion(version.id)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Load
                  </Button>
                   <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteVersion(version.id)}
                    disabled={versions.length <= 1}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
