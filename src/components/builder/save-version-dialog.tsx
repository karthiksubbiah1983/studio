
"use client";

import { useState } from "react";
import { useBuilder } from "@/hooks/use-builder";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saveType: "draft" | "published";
};

export function SaveVersionDialog({ isOpen, onOpenChange, saveType }: Props) {
  const { activeForm, sections, dispatch } = useBuilder();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSave = () => {
    dispatch({
      type: "SAVE_VERSION",
      payload: {
        name,
        description,
        type: saveType,
        sections: sections,
      },
    });

    toast({
      title: "Save Successful!",
      description: `Saved "${activeForm?.title}" as version "${name}".`,
    });

    onOpenChange(false);
    setName("");
    setDescription("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Save as {saveType === "draft" ? "Draft" : "Published Version"}
          </DialogTitle>
          <DialogDescription>
            Enter a name and description for this version of your form.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., 'Q3 Marketing Update'"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="Optional: A brief summary of the changes in this version."
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={!name.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
