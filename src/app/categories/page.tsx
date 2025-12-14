
"use client";

import { useState, useEffect } from "react";
import { useBuilder } from "@/hooks/use-builder";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Category, SubCategory } from "@/lib/types";
import { Plus, Trash, X, GripVertical, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function CategoriesPage() {
  const { state, dispatch } = useBuilder();
  const { categories } = state;
  const { toast } = useToast();
  
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubCategoryNames, setNewSubCategoryNames] = useState<Record<string, string>>({});
  const [editingCategoryNames, setEditingCategoryNames] = useState<Record<string, string>>({});
  const [originalCategoryNames, setOriginalCategoryNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const initialEditingNames: Record<string, string> = {};
    const initialOriginalNames: Record<string, string> = {};
    categories.forEach(cat => {
      initialEditingNames[cat.id] = cat.name;
      initialOriginalNames[cat.id] = cat.name;
    });
    setEditingCategoryNames(initialEditingNames);
    setOriginalCategoryNames(initialOriginalNames);
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
  };

  const handleUpdateCategory = (categoryId: string) => {
    const newName = editingCategoryNames[categoryId]?.trim();
    const originalName = originalCategoryNames[categoryId];

    if (!newName || newName === originalName) return;
    
    dispatch({ type: "UPDATE_CATEGORY", payload: { category: { ...categories.find(c => c.id === categoryId)!, name: newName } } });
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
    <div className="w-full p-4 md:p-6">
      <Card>
        <CardContent>
          <div className="flex items-center gap-2 mb-6">
            <Input
              placeholder="New category name..."
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
               onKeyDown={e => { if (e.key === 'Enter') handleAddCategory()}}
            />
            <Button onClick={handleAddCategory}>
              <Plus className="mr-2 h-4 w-4" /> Add Category
            </Button>
          </div>

          <div className="border rounded-lg">
             <div className="hidden md:grid grid-cols-[50px_1fr_1fr_150px] items-center p-4 border-b font-medium text-sm text-muted-foreground">
                  <div />
                  <div>Category Name</div>
                  <div>Sub-categories</div>
                  <div className="text-right">Actions</div>
              </div>
              <div className="divide-y">
                {categories.length > 0 ? (
                  categories.map(cat => (
                    <div key={cat.id} className="grid grid-cols-1 md:grid-cols-[50px_1fr_1fr_150px] items-center p-4 gap-4 md:gap-2">
                      <div className="cursor-grab text-muted-foreground hidden md:block">
                        <GripVertical />
                      </div>
                      <div>
                         <span className="md:hidden font-medium mr-2">Category:</span>
                        <Input
                          value={editingCategoryNames[cat.id] || ''}
                          onChange={e => setEditingCategoryNames(prev => ({ ...prev, [cat.id]: e.target.value }))}
                          onBlur={() => handleUpdateCategory(cat.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateCategory(cat.id) }}
                          className="font-medium"
                        />
                      </div>
                      <div>
                         <span className="md:hidden font-medium mr-2">Sub-categories:</span>
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
                      </div>
                      <div className="text-right">
                         <span className="md:hidden font-medium mr-2">Actions:</span>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)}>
                                <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-24 text-center flex items-center justify-center">
                    No categories found.
                  </div>
                )}
              </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
