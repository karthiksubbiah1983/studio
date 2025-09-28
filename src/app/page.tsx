
"use client";

import { useBuilder } from "@/hooks/use-builder";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Edit, PlusCircle, Trash, Search, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils";

export default function Home() {
  const { state, dispatch } = useBuilder();
  const { forms } = state;
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewTemplateDialogOpen, setIsNewTemplateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [cloningFormId, setCloningFormId] = useState<string | null>(null);
  const [newCloneName, setNewCloneName] = useState("");


  const filteredForms = forms.filter(form => 
    form.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNew = () => {
    if (!newTemplateName.trim()) return;
    const newFormId = dispatch({ 
      type: "ADD_FORM", 
      payload: { 
        title: newTemplateName,
        description: newTemplateDescription,
      } 
    });
    if (newFormId) {
      router.push(`/builder/${newFormId}`);
    }
    setNewTemplateName("");
    setNewTemplateDescription("");
    setIsNewTemplateDialogOpen(false);
  };

  const handleEdit = (formId: string) => {
    router.push(`/builder/${formId}`);
  };

  const handleDelete = (formId: string) => {
    dispatch({ type: "DELETE_FORM", payload: { formId } });
  };
  
  const handleOpenCloneDialog = (formId: string) => {
    const formToClone = forms.find(f => f.id === formId);
    if (!formToClone) return;
    setCloningFormId(formId);
    setNewCloneName(`Copy of ${formToClone.title}`);
    setIsCloneDialogOpen(true);
  };

  const handleClone = () => {
    if (!cloningFormId || !newCloneName.trim()) return;
    dispatch({ 
        type: "CLONE_FORM", 
        payload: { 
            formId: cloningFormId,
            newName: newCloneName,
        } 
    });
    setIsCloneDialogOpen(false);
    setCloningFormId(null);
    setNewCloneName("");
  };


  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Your Templates</CardTitle>
              <CardDescription>Manage your existing form templates or create a new one.</CardDescription>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search templates..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Dialog open={isNewTemplateDialogOpen} onOpenChange={setIsNewTemplateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Template</DialogTitle>
                    <DialogDescription>
                      Give your new template a name and an optional description.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="template-name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="template-name"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        className="col-span-3"
                        placeholder="e.g., 'Customer Inquiry Form'"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="template-description" className="text-right">
                        Description
                      </Label>
                       <Textarea
                        id="template-description"
                        value={newTemplateDescription}
                        onChange={(e) => setNewTemplateDescription(e.target.value)}
                        className="col-span-3"
                        placeholder="Optional: A brief summary of this template's purpose."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="secondary" onClick={() => setIsNewTemplateDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateNew} disabled={!newTemplateName.trim()}>Create Template</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredForms.length > 0 ? (
                  filteredForms.map((form) => {
                    const latestVersion = form.versions[0];
                    const publishedVersion = form.versions.find(v => v.type === 'published');
                    const displayVersion = publishedVersion || latestVersion;
                    const status = displayVersion.type === 'published' ? 'Published' : 'Draft';

                    return (
                      <TableRow key={form.id}>
                        <TableCell className="font-medium">{form.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{displayVersion.name}</span>
                            <Badge className={cn(
                              status === 'Published' && "bg-green-100 text-green-800 border-green-200"
                            )} variant={status === 'Published' ? 'outline' : 'secondary'}>
                              {status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(latestVersion.timestamp), "PPP p")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                             <Button variant="ghost" size="icon" onClick={() => handleOpenCloneDialog(form.id)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(form.id)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                             <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the template
                                    and all its versions.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(form.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No templates found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCloneDialogOpen} onOpenChange={setIsCloneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone Template</DialogTitle>
            <DialogDescription>
              Enter a new name for the cloned template.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clone-name" className="text-right">
                New Name
              </Label>
              <Input
                id="clone-name"
                value={newCloneName}
                onChange={(e) => setNewCloneName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsCloneDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleClone} disabled={!newCloneName.trim()}>Clone</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
