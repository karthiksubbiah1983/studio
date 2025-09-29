
"use client";

import { useBuilder } from "@/hooks/use-builder";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Edit, PlusCircle, Trash, Search, Copy, Plus, X } from "lucide-react";
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
import { Category, SubCategory } from "@/lib/types";

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

  // Category Management Dialog State
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [subCategoryNames, setSubCategoryNames] = useState<Record<string, string>>({});

  const filteredForms = forms.filter(form => 
    form.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getCategoryName = (categoryId: string | undefined) => {
    if (!categoryId) return "Uncategorized";
    return categories.find(c => c.id === categoryId)?.name || "Uncategorized";
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

  // Category Management Handlers
  const handleAddCategory = () => {
    if (!categoryName.trim()) return;
    dispatch({ type: "ADD_CATEGORY", payload: { name: categoryName } });
    setCategoryName("");
  }
  
  const handleUpdateCategory = (category: Category) => {
    dispatch({ type: "UPDATE_CATEGORY", payload: { category } });
  }

  const handleDeleteCategory = (categoryId: string) => {
    dispatch({ type: "DELETE_CATEGORY", payload: { categoryId } });
  }

  const handleAddSubCategory = (categoryId: string) => {
    const subCategoryName = subCategoryNames[categoryId]?.trim();
    if (!subCategoryName) return;
    dispatch({ type: "ADD_SUBCATEGORY", payload: { categoryId, name: subCategoryName } });
    setSubCategoryNames(prev => ({...prev, [categoryId]: ""}));
  }

  const handleUpdateSubCategory = (categoryId: string, subCategory: SubCategory) => {
    dispatch({ type: "UPDATE_SUBCATEGORY", payload: { categoryId, subCategory } });
  }

  const handleDeleteSubCategory = (categoryId: string, subCategoryId: string) => {
     dispatch({ type: "DELETE_SUBCATEGORY", payload: { categoryId, subCategoryId } });
  }

  const selectedCategoryForNewTemplate = categories.find(c => c.id === selectedCategoryId);

  return (
    <div className="w-full p-4 md:p-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Templates</CardTitle>
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
              
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">Manage Categories</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Manage Categories</DialogTitle>
                        <DialogDescription>Add, edit, or delete categories and their sub-categories.</DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center gap-2 mt-4">
                        <Input 
                            placeholder="New category name..."
                            value={categoryName}
                            onChange={e => setCategoryName(e.target.value)}
                        />
                        <Button onClick={handleAddCategory}><Plus className="mr-2 h-4 w-4"/> Add Category</Button>
                    </div>
                    <div className="mt-4 max-h-[50vh] overflow-y-auto space-y-4 pr-2">
                        {categories.map(cat => (
                            <Card key={cat.id}>
                                <CardHeader className="p-4 flex-row items-center justify-between">
                                    <Input value={cat.name} onChange={e => handleUpdateCategory({...cat, name: e.target.value})} className="text-base font-semibold"/>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)}>
                                        <Trash className="h-4 w-4 text-destructive"/>
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 space-y-2">
                                    <Label className="text-xs text-muted-foreground">Sub-categories</Label>
                                    {cat.subCategories.map(sub => (
                                        <div key={sub.id} className="flex items-center gap-2">
                                            <Input value={sub.name} onChange={e => handleUpdateSubCategory(cat.id, {...sub, name: e.target.value})}/>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteSubCategory(cat.id, sub.id)}>
                                                <X className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-2">
                                        <Input 
                                            placeholder="New sub-category..."
                                            value={subCategoryNames[cat.id] || ""}
                                            onChange={e => setSubCategoryNames(prev => ({...prev, [cat.id]: e.target.value}))}
                                        />
                                        <Button size="sm" onClick={() => handleAddSubCategory(cat.id)}>Add</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </DialogContent>
              </Dialog>

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
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-50 hover:bg-blue-50">
                  <TableHead className="text-gray-700">Template Name</TableHead>
                  <TableHead className="text-gray-700">Category</TableHead>
                  <TableHead className="text-gray-700">Version</TableHead>
                  <TableHead className="text-gray-700">Last Modified</TableHead>
                  <TableHead className="text-right text-gray-700">Actions</TableHead>
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
                    <TableCell colSpan={5} className="h-24 text-center">
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

    