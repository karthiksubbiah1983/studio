
'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChecklistCategory } from "@/lib/types";

type Props = {
    availableCategories: ChecklistCategory[];
    onSelect: (selectedIds: string[]) => void;
}

export function CategorySelector({ availableCategories, onSelect }: Props) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const handleToggle = (id: string, checked: boolean) => {
        setSelectedIds(prev =>
            checked ? [...prev, id] : prev.filter(i => i !== id)
        );
    };

    const handleSubmit = () => {
        onSelect(selectedIds);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Select Categories</CardTitle>
                    <CardDescription>
                        Choose the categories you need to work on for this task.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {availableCategories.map(cat => (
                            <div key={cat.id} className="flex items-center space-x-3 p-3 border rounded-md has-[:checked]:bg-blue-50 has-[:checked]:border-blue-200">
                                <Checkbox
                                    id={`cat-${cat.id}`}
                                    checked={selectedIds.includes(cat.id)}
                                    onCheckedChange={(checked) => handleToggle(cat.id, !!checked)}
                                />
                                <Label htmlFor={`cat-${cat.id}`} className="text-base font-medium cursor-pointer">
                                    {cat.name}
                                </Label>
                            </div>
                        ))}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        className="w-full"
                        onClick={handleSubmit}
                        disabled={selectedIds.length === 0}
                    >
                        Continue
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

