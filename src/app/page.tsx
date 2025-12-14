
"use client";

import { useBuilder } from "@/hooks/use-builder";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Edit, PlusCircle, Trash, Search, Copy, Send } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

function FormattedDate({ timestamp }: { timestamp: string }) {
    const [formattedDate, setFormattedDate] = useState<string | null>(null);

    useEffect(() => {
        if (timestamp) {
            setFormattedDate(format(new Date(timestamp), "PPP p"));
        } else {
             setFormattedDate('—');
        }
    }, [timestamp]);

    // Render a placeholder on the server and initial client render
    if (formattedDate === null) {
        return <span>—</span>; // Or a loading skeleton
    }

    return <>{formattedDate}</>;
}


export default function Home() {
  const { state, dispatch, addNewForm } = useBuilder();
  const { forms, categories, sites } = state;
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  
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

  // Assign Task Dialog State
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [assigningFormId, setAssigningFormId] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

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

  const handleCreateNew = async () => {
    if (!newTemplateName.trim() || !selectedCategoryId) return;
    
    try {
        const docRef = await addNewForm({ 
          title: newTemplateName,
          description: newTemplateDescription,
          categoryId: selectedCategoryId,
          subCategoryId: selectedSubCategoryId,
        });
        
        // Reset fields
        setNewTemplateName("");
        setNewTemplateDescription("");
        setSelectedCategoryId(null);
        setSelectedSubCategoryId(null);
        setIsNewTemplateDialogOpen(false);
        
        // Navigate after we have the new ID
        if (docRef?.id) {
            router.push(`/builder/${docRef.id}`);
        }
    } catch (error) {
        console.error("Failed to create form:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not create the new form template.",
        });
    }
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

  const handleOpenAssignDialog = (formId: string) => {
    setAssigningFormId(formId);
    setIsAssignTaskOpen(true);
  }

  const handleAssignTask = () => {
    if (!assigningFormId || !selectedSiteId) return;
    const form = forms.find(f => f.id === assigningFormId);
    if (!form || !form.versions[0]) return;

    dispatch({
      type: 'ADD_TASK',
      payload: {
        formId: assigningFormId,
        versionId: form.versions[0].id,
        siteId: selectedSiteId,
      }
    });

    toast({
      title: "Task Assigned!",
      description: `Assigned "${form.title}" to site.`,
    });

    setIsAssignTaskOpen(false);
    setAssigningFormId(null);
    setSelectedSiteId(null);
  }

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
            <Link href="/categories">
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
              <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-center p-4 border-b font-medium text-sm text-muted-foreground">
                  <div>Template Name</div>
                  <div>Category</div>
                  <div>Sub Category</div>
                  <div>Version</div>
                  <div>Last Modified</div>
                  <div className="text-right">Actions</div>
              </div>
              <div className="divide-y">
                {filteredForms.length > 0 ? (
                  filteredForms.map((form) => {
                    const latestVersion = form.versions[0];
                    const publishedVersions = form.versions.filter(v => v.type === 'published');
                    const latestPublishedVersion = publishedVersions[0];
                    
                    const versionNumber = latestPublishedVersion ? publishedVersions.length : 0;
                    const status = latestVersion.type === 'published' ? 'Published' : 'Draft';
                    const displayVersionText = status === 'Published' ? `v${versionNumber}` : 'Draft';

                    return (
                      <div key={form.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-center p-4 gap-4 md:gap-2">
                        <div className="font-medium">{form.title}</div>
                        <div>
                            <span className="md:hidden font-medium mr-2">Category:</span>
                            {getCategoryName(form.categoryId)}
                        </div>
                        <div>
                            <span className="md:hidden font-medium mr-2">Sub Category:</span>
                            {getSubCategoryName(form.categoryId, form.subCategoryId)}
                        </div>
                        <div>
                            <span className="md:hidden font-medium mr-2">Version:</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">{displayVersionText}</span>
                                <Badge className={cn(
                                status === 'Published' && "bg-green-100 text-green-800 border-green-200"
                                )} variant={status === 'Published' ? 'outline' : 'secondary'}>
                                {status}
                                </Badge>
                            </div>
                        </div>
                        <div>
                            <span className="md:hidden font-medium mr-2">Last Modified:</span>
                            <FormattedDate timestamp={latestVersion.timestamp} />
                        </div>
                        <div className="flex justify-end gap-0">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenAssignDialog(form.id)}>
                              <Send className="h-4 w-4" />
                            </Button>
                             <Button variant="ghost" size="icon" onClick={() => handleOpenCloneDialog(form.id)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Link href={`/builder/${form.id}`}>
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
                      </div>
                    );
                  })
                ) : (
                  <div className="h-24 text-center flex items-center justify-center">
                    No templates found.
                  </div>
                )}
              </div>
          </div>
        </CardContent>
      </Card>

      {/* Clone Dialog */}
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
      
      {/* Assign Task Dialog */}
      <Dialog open={isAssignTaskOpen} onOpenChange={setIsAssignTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Task</DialogTitle>
            <DialogDescription>
              Select a site to assign this form to.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="site" className="text-right">
                Site
              </Label>
              <Select value={selectedSiteId || ""} onValueChange={setSelectedSiteId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(site => (
                    <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                  ))}
                  {sites.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">No sites found. <Link href="/sites" className="text-primary underline">Create one?</Link></div>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsAssignTaskOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignTask} disabled={!selectedSiteId}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

    