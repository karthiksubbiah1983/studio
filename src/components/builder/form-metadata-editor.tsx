
"use client";

import { useBuilder } from "@/hooks/use-builder";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";

export function FormMetadataEditor() {
  const { activeForm, categories, dispatch } = useBuilder();

  const [selectedCategoryId, setSelectedCategoryId] = useState(activeForm?.categoryId);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(activeForm?.subCategoryId);

  useEffect(() => {
    setSelectedCategoryId(activeForm?.categoryId);
    setSelectedSubCategoryId(activeForm?.subCategoryId);
  }, [activeForm]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubCategoryId(null); // Reset sub-category when category changes
    dispatch({ type: "UPDATE_FORM_METADATA", payload: { categoryId, subCategoryId: null } });
  };
  
  const handleSubCategoryChange = (subCategoryId: string) => {
    setSelectedSubCategoryId(subCategoryId);
    dispatch({ type: "UPDATE_FORM_METADATA", payload: { categoryId: selectedCategoryId, subCategoryId } });
  }

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <Card>
        <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="template-category">Category</Label>
                    <Select value={selectedCategoryId || ""} onValueChange={handleCategoryChange}>
                        <SelectTrigger id="template-category">
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 {selectedCategory && selectedCategory.subCategories.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="template-subcategory">Sub-category</Label>
                         <Select value={selectedSubCategoryId || ""} onValueChange={handleSubCategoryChange}>
                            <SelectTrigger id="template-subcategory">
                                <SelectValue placeholder="Select a sub-category" />
                            </SelectTrigger>
                            <SelectContent>
                                {selectedCategory.subCategories.map(sub => <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                 )}
            </div>
        </CardContent>
    </Card>
  );
}
