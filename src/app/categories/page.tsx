
"use client";

import { useState } from "react";
import { useBuilder } from "@/hooks/use-builder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Category, SubCategory } from "@/lib/types";
import { Plus, Trash, X, GripVertical } from "lucide-react";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function CategoriesPage() {
  const { state, dispatch } = useBuilder();
  const { categories } = state;
  
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubCategoryNames, setNewSubCategoryNames] = useState<Record<string, string>>({});

  // Category Management Handlers
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    dispatch({ type: "ADD_CATEGORY", payload: { name: newCategoryName } });
    setNewCategoryName("");
  };

  const handleUpdateCategory = (category: Category) => {
    dispatch({ type: "UPDATE_CATEGORY", payload: { category } });
  };

  const handleDeleteCategory = (categoryId: string) => {
    dispatch({ type: "DELETE_CATEGORY", payload: { categoryId } });
  };

  // Sub-category Handlers
  const handleAddSubCategory = (categoryId: string) => {
    const subCategoryName = newSubCategoryNames[categoryId]?.trim();
    if (!subCategoryName) return;
    dispatch({ type: "ADD_SUBCATEGORY", payload: { categoryId, name: subCategoryName } });
    setNewSubCategoryNames(prev => ({ ...prev, [categoryId]: "" }));
  };

  const handleDeleteSubCategory = (categoryId: string, subCategoryId: string) => {
    dispatch({ type: "DELETE_SUBCATEGORY", payload: { categoryId, subCategoryId } });
  };

  return (
    <div className="w-full p-4 md:p-8">
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
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
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
                          value={cat.name}
                          onChange={e => handleUpdateCategory({ ...cat, name: e.target.value })}
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
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)}>
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
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
