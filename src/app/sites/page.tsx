
"use client";

import { useState } from "react";
import { useBuilder } from "@/hooks/use-builder";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SitesPage() {
  const { state, dispatch } = useBuilder();
  const { sites } = state;
  const { toast } = useToast();
  
  const [newSiteName, setNewSiteName] = useState("");

  const handleAddSite = () => {
    if (!newSiteName.trim()) return;
    dispatch({ type: "ADD_SITE", payload: { name: newSiteName } });
    toast({
        title: "Site Added",
        description: `"${newSiteName}" has been successfully added.`
    });
    setNewSiteName("");
  };

  const handleDeleteSite = (siteId: string) => {
    const siteName = sites.find(s => s.id === siteId)?.name;
    dispatch({ type: "DELETE_SITE", payload: { siteId } });
     toast({
        title: "Site Deleted",
        description: `"${siteName}" has been deleted.`,
        variant: 'destructive'
    });
  };

  return (
    <div className="w-full p-4 md:p-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Input
              placeholder="New site name..."
              value={newSiteName}
              onChange={e => setNewSiteName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddSite()}}
            />
            <Button onClick={handleAddSite}>
              <Plus className="mr-2 h-4 w-4" /> Add Site
            </Button>
          </div>

          <div className="border rounded-lg">
             <div className="hidden md:grid grid-cols-[50px_1fr_150px] items-center p-4 border-b font-medium text-sm text-muted-foreground">
                  <div />
                  <div>Site Name</div>
                  <div className="text-right">Actions</div>
              </div>
              <div className="divide-y">
                {sites.length > 0 ? (
                  sites.map(site => (
                    <div key={site.id} className="grid grid-cols-1 md:grid-cols-[50px_1fr_150px] items-center p-4 gap-4 md:gap-2">
                      <div className="cursor-grab text-muted-foreground hidden md:block">
                        <GripVertical />
                      </div>
                      <div>
                         <span className="md:hidden font-medium mr-2">Site:</span>
                        <div className="font-medium">{site.name}</div>
                      </div>
                      <div className="text-right">
                         <span className="md:hidden font-medium mr-2">Actions:</span>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteSite(site.id)}>
                                <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-24 text-center flex items-center justify-center">
                    No sites found. Add one to get started.
                  </div>
                )}
              </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
