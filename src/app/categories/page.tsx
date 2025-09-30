
"use client";

import { useState, useEffect } from "react";
import { useBuilder } from "@/hooks/use-builder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Category, SubCategory } from "@/lib/types";
import { Plus, Trash, X, GripVertical, Save } from "lucide-react";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function CategoriesPage() {
  const { state, dispatch } = useBuilder();
  const { categories } = state;
  const { toast } = useToast();
  
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubCategoryNames, setNewSubCategoryNames] = useState<Record<string, string>>({});
  const [editingCategoryNames, setEditingCategoryNames] = useState<Record<string, string>>({});

  // Initialize editing state
  useEffect(() => {
    const initialEditingNames: Record<string, string> = {};
    categories.forEach(cat => {
      initialEditingNames[cat.id] = cat.name;
    });
    setEditingCategoryNames(initialEditingNames);
  }, [categories]);

  // Category Management Handlers
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    dispatch({ type: "ADD_CATEGORY", payload: { name: newCategoryName } });
    toast({
        title: "Category Added",
        description: `"${newCategoryName}" has been successfully added.`
    });
    setNewCategoryName("");
    setEditingCategoryNames(prev => ({...prev, [newCategoryName]: newCategoryName}))
  };

  const handleUpdateCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    const newName = editingCategoryNames[categoryId];
    if (!category || !newName || !newName.trim()) return;
    
    dispatch({ type: "UPDATE_CATEGORY", payload: { category: { ...category, name: newName } } });
    toast({
        title: "Category Saved",
        description: `Category has been updated to "${newName}".`
    });
  };

  const handleDeleteCategory = (categoryId: string) => {
    const categoryName = categories.find(c => c.id === categoryId)?.name;
    dispatch({ type: "DELETE_CATEGORY", payload: { categoryId } });
     toast({
        title: "Category Deleted",
        description: `"${categoryName}" has been deleted.`,
        variant: 'destructive'
    });
  };

  // Sub-category Handlers
  const handleAddSubCategory = (categoryId: string) => {
    const subCategoryName = newSubCategoryNames[categoryId]?.trim();
    if (!subCategoryName) return;
    dispatch({ type: "ADD_SUBCATEGORY", payload: { categoryId, name: subCategoryName } });
     toast({
        title: "Sub-category Added",
        description: `"${subCategoryName}" has been added.`
    });
    setNewSubCategoryNames(prev => ({ ...prev, [categoryId]: "" }));
  };

  const handleDeleteSubCategory = (categoryId: string, subCategoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    const subCategoryName = category?.subCategories.find(sc => sc.id === subCategoryId)?.name;
    dispatch({ type: "DELETE_SUBCATEGORY", payload: { categoryId, subCategoryId } });
     toast({
        title: "Sub-category Deleted",
        description: `"${subCategoryName}" has been deleted.`,
        variant: 'destructive'
    });
  };

  return (
    <div className="w-full p-4">
      <Card>
        <CardHeader>
          <CardTitle>Manage Categories</CardTitle>
          <CardDescription>
            Add, edit, or delete categories and their sub-categories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-6">
            <Input
              placeholder="New category name..."
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
            />
            <Button onClick={handleAddCategory}>
              <Plus className="mr-2 h-4 w-4" /> Add Category
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Sub-categories</TableHead>
                  <TableHead className="text-right w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length > 0 ? (
                  categories.map(cat => (
                    <TableRow key={cat.id}>
                      <TableCell className="cursor-grab text-muted-foreground">
                        <GripVertical />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editingCategoryNames[cat.id] || cat.name}
                          onChange={e => setEditingCategoryNames(prev => ({ ...prev, [cat.id]: e.target.value }))}
                          className="font-medium"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          {cat.subCategories.map(sub => (
                            <Badge key={sub.id} variant="secondary" className="group">
                              {sub.name}
                              <button onClick={() => handleDeleteSubCategory(cat.id, sub.id)} className="ml-1.5 rounded-full opacity-50 group-hover:opacity-100 transition-opacity">
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                          <div className="flex items-center gap-1">
                            <Input
                              placeholder="Add new..."
                              className="h-7 text-xs w-28"
                              value={newSubCategoryNames[cat.id] || ""}
                              onChange={e => setNewSubCategoryNames(prev => ({ ...prev, [cat.id]: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') handleAddSubCategory(cat.id)}}
                            />
                             <Button size="xs" variant="outline" className="h-7" onClick={() => handleAddSubCategory(cat.id)}>
                                Add
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleUpdateCategory(cat.id)}>
                                <Save className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)}>
                                <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No categories found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
