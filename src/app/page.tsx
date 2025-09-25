
"use client";

import { useBuilder } from "@/hooks/use-builder";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash, Eye, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { FormPreview } from "@/components/builder/form-preview";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


export default function Home() {
  const { state, dispatch } = useBuilder();
  const router = useRouter();
  const [previewFormId, setPreviewFormId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newFormName, setNewFormName] = useState("");

  const handleCreateNew = () => {
    if (!newFormName.trim()) return;
    const newFormId = dispatch({ type: "ADD_FORM", payload: { title: newFormName } });
    if (newFormId) {
        router.push(`/builder/${newFormId}`);
    }
    setNewFormName("");
    setIsCreateDialogOpen(false);
  };

  const handleEdit = (formId: string) => {
    router.push(`/builder/${formId}`);
  };

  const handleDelete = (formId: string) => {
    dispatch({ type: "DELETE_FORM", payload: { formId } });
  };
  
  const handlePreview = (formId: string) => {
    dispatch({ type: "SET_ACTIVE_FORM", payload: { formId } });
    setPreviewFormId(formId);
  }

  const latestVersion = (versions: any[]) => {
    if (versions.length === 0) return null;
    return versions[0];
  }

  const getVersionSummary = (versions: any[]) => {
    const publishedCount = versions.filter(v => v.type === 'published').length;
    const draftCount = versions.filter(v => v.type === 'draft').length;
    return `${publishedCount} published, ${draftCount} drafts`;
  }

  return (
    <>
      <main className="flex flex-col items-center w-full min-h-screen bg-background p-4 md:p-8">
        <div className="w-full max-w-6xl">
          <header className="flex items-center justify-between pb-8">
            <div>
              <h1 className="text-3xl font-bold text-primary">CoPilot</h1>
              <p className="text-muted-foreground">Manage your form templates.</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Form
                </Button>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Form</DialogTitle>
                        <DialogDescription>
                            Enter a name for your new form template.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={newFormName}
                                onChange={(e) => setNewFormName(e.target.value)}
                                className="col-span-3"
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateNew} disabled={!newFormName.trim()}>
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </header>

          <Card>
            <CardHeader>
              <CardTitle>Your Forms</CardTitle>
              <CardDescription>A list of all your saved form templates.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Latest Version</TableHead>
                    <TableHead>Version Summary</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.forms.length > 0 ? (
                    state.forms.map((form) => {
                      const latest = latestVersion(form.versions);
                      return (
                        <TableRow key={form.id}>
                          <TableCell className="font-medium">{form.title}</TableCell>
                          <TableCell>
                            {latest ? (
                              <div className="flex items-center gap-2">
                                <Badge variant={latest.type === 'published' ? 'default' : 'secondary'}>
                                  {latest.type}
                                </Badge>
                                <span className="text-muted-foreground text-xs">{new Date(latest.timestamp).toLocaleDateString()}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No versions yet</span>
                            )}
                          </TableCell>
                          <TableCell>{getVersionSummary(form.versions)}</TableCell>
                          <TableCell className="text-right">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                   <DropdownMenuItem onClick={() => handlePreview(form.id)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Preview
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEdit(form.id)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" className="w-full justify-start text-sm font-normal text-destructive hover:text-destructive p-2">
                                        <Trash className="mr-2 h-4 w-4" />
                                        Delete
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will permanently delete the form "{form.title}" and all its versions. This action cannot be undone.
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
                                </DropdownMenuContent>
                              </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">
                        No forms created yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={!!previewFormId} onOpenChange={(isOpen) => !isOpen && setPreviewFormId(null)}>
        <DialogContent className="max-w-4xl h-screen max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Form Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto">
            {previewFormId && <FormPreview />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
