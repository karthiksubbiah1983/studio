
"use client";

import { useState } from "react";
import { useBuilder } from "@/hooks/use-builder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Category, SubCategory } from "@/lib/types";
import { Plus, Trash, X } from "lucide-react";

export default function CategoriesPage() {
  const { state, dispatch } = useBuilder();
  const { categories } = state;
  
  const [categoryName, setCategoryName] = useState("");
  const [subCategoryNames, setSubCategoryNames] = useState<Record<string, string>>({});

  // Category Management Handlers
  const handleAddCategory = () => {
    if (!categoryName.trim()) return;
    dispatch({ type: "ADD_CATEGORY", payload: { name: categoryName } });
    setCategoryName("");
  };

  const handleUpdateCategory = (category: Category) => {
    dispatch({ type: "UPDATE_CATEGORY", payload: { category } });
  };

  const handleDeleteCategory = (categoryId: string) => {
    dispatch({ type: "DELETE_CATEGORY", payload: { categoryId } });
  };

  const handleAddSubCategory = (categoryId: string) => {
    const subCategoryName = subCategoryNames[categoryId]?.trim();
    if (!subCategoryName) return;
    dispatch({ type: "ADD_SUBCATEGORY", payload: { categoryId, name: subCategoryName } });
    setSubCategoryNames(prev => ({ ...prev, [categoryId]: "" }));
  };

  const handleUpdateSubCategory = (categoryId: string, subCategory: SubCategory) => {
    dispatch({ type: "UPDATE_SUBCATEGORY", payload: { categoryId, subCategory } });
  };

  const handleDeleteSubCategory = (categoryId: string, subCategoryId: string) => {
    dispatch({ type: "DELETE_SUBCATEGORY", payload: { categoryId, subCategoryId } });
  };

  return (
    <div className="w-full p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Manage Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-6">
            <Input
              placeholder="New category name..."
              value={categoryName}
              onChange={e => setCategoryName(e.target.value)}
            />
            <Button onClick={handleAddCategory}>
              <Plus className="mr-2 h-4 w-4" /> Add Category
            </Button>
          </div>
          <div className="space-y-4">
            {categories.map(cat => (
              <Card key={cat.id}>
                <CardHeader className="p-4 flex-row items-center justify-between">
                  <Input
                    value={cat.name}
                    onChange={e => handleUpdateCategory({ ...cat, name: e.target.value })}
                    className="text-base font-semibold"
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)}>
                    <Trash className="h-4 w-4 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  <Label className="text-xs text-muted-foreground">Sub-categories</Label>
                  {cat.subCategories.map(sub => (
                    <div key={sub.id} className="flex items-center gap-2">
                      <Input
                        value={sub.name}
                        onChange={e => handleUpdateSubCategory(cat.id, { ...sub, name: e.target.value })}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteSubCategory(cat.id, sub.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="New sub-category..."
                      value={subCategoryNames[cat.id] || ""}
                      onChange={e => setSubCategoryNames(prev => ({ ...prev, [cat.id]: e.target.value }))}
                    />
                    <Button size="sm" onClick={() => handleAddSubCategory(cat.id)}>
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    