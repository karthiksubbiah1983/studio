
"use client";

import { useBuilder } from "@/hooks/use-builder";
import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import type { Form } from "@/lib/types";
import { PageHeader } from "@/components/page-header";

function FormattedDate({ timestamp }: { timestamp: string }) {
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        setFormattedDate(format(new Date(timestamp), "PPP p"));
    }, [timestamp]);

    return <>{formattedDate}</>;
}


export default function Home() {
  const { state, dispatch } = useBuilder();
  const { forms, categories } = state;
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  
  // New Template Dialog State
  const [isNewTemplateDialogOpen, setIsNewTemplateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | null>(null);

  // Clone Dialog State
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [cloningFormId, setCloningFormId] = useState<string | null>(null);
  const [newCloneName, setNewCloneName] = useState("");

  const filteredForms = forms.filter(form => 
    form.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getCategoryName = (categoryId: string | undefined) => {
    if (!categoryId) return "Uncategorized";
    return categories.find(c => c.id === categoryId)?.name || "Uncategorized";
  }

  const getSubCategoryName = (categoryId: string | undefined, subCategoryId: string | undefined) => {
    if (!categoryId || !subCategoryId) return "—";
    const category = categories.find(c => c.id === categoryId);
    if (!category) return "—";
    const subCategory = category.subCategories.find(sc => sc.id === subCategoryId);
    return subCategory?.name || "—";
  }

  const handleCreateNew = () => {
    if (!newTemplateName.trim() || !selectedCategoryId) return;
    const newFormId = dispatch({ 
      type: "ADD_FORM", 
      payload: { 
        title: newTemplateName,
        description: newTemplateDescription,
        categoryId: selectedCategoryId,
        subCategoryId: selectedSubCategoryId,
      } 
    });
    if (newFormId) {
      router.push(`/builder/${newFormId}`);
    }
    // Reset fields
    setNewTemplateName("");
    setNewTemplateDescription("");
    setSelectedCategoryId(null);
    setSelectedSubCategoryId(null);
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

  const selectedCategoryForNewTemplate = categories.find(c => c.id === selectedCategoryId);

  return (
    <div className="w-full p-4 md:p-6">
       <PageHeader 
        title="Template Management"
        description="Create, edit, and manage all your form templates from one place. You can organize them by categories and sub-categories."
      />
      <div className="flex justify-between items-center mb-4">
        <div className="relative flex-grow max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
            type="search"
            placeholder="Search templates..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex gap-2">
            <Link href="/categories" passHref>
                <Button variant="outline">Manage Categories</Button>
            </Link>

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
                    Give your new template a name and assign it to a category.
                </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="template-name" className="text-right">Name</Label>
                    <Input id="template-name" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} className="col-span-3" placeholder="e.g., 'Customer Inquiry Form'" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="template-category" className="text-right">Category</Label>
                    <Select value={selectedCategoryId || ""} onValueChange={setSelectedCategoryId}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                    {selectedCategoryForNewTemplate && selectedCategoryForNewTemplate.subCategories.length > 0 && (
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="template-subcategory" className="text-right">Sub-category</Label>
                            <Select value={selectedSubCategoryId || ""} onValueChange={setSelectedSubCategoryId}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a sub-category" />
                            </SelectTrigger>
                            <SelectContent>
                                {selectedCategoryForNewTemplate.subCategories.map(sub => <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    )}
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="template-description" className="text-right">Description</Label>
                    <Textarea id="template-description" value={newTemplateDescription} onChange={(e) => setNewTemplateDescription(e.target.value)} className="col-span-3" placeholder="Optional: A brief summary of this template's purpose."/>
                </div>
                </div>
                <DialogFooter>
                <Button variant="secondary" onClick={() => setIsNewTemplateDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateNew} disabled={!newTemplateName.trim() || !selectedCategoryId}>Create Template</Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Sub Category</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredForms.length > 0 ? (
                  filteredForms.map((form) => {
                    const latestVersion = form.versions[0];
                    const publishedVersions = form.versions.filter(v => v.type === 'published');
                    const latestPublishedVersion = publishedVersions[0];
                    
                    const versionNumber = latestPublishedVersion ? publishedVersions.length : 0;
                    const status = latestVersion.type === 'published' ? 'Published' : 'Draft';
                    const displayVersionText = status === 'Published' ? `v${versionNumber}` : 'Draft';

                    return (
                      <TableRow key={form.id}>
                        <TableCell className="font-medium">{form.title}</TableCell>
                        <TableCell>{getCategoryName(form.categoryId)}</TableCell>
                        <TableCell>{getSubCategoryName(form.categoryId, form.subCategoryId)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{displayVersionText}</span>
                            <Badge className={cn(
                              status === 'Published' && "bg-green-100 text-green-800 border-green-200"
                            )} variant={status === 'Published' ? 'outline' : 'secondary'}>
                              {status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell><FormattedDate timestamp={latestVersion.timestamp} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-0">
                             <Button variant="ghost" size="icon" onClick={() => handleOpenCloneDialog(form.id)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Link href={`/builder/${form.id}`} passHref>
                                <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </Link>
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
                    <TableCell colSpan={6} className="h-24 text-center">
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

    
