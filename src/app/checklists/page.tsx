
"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { useBuilder } from '@/hooks/use-builder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Edit, Trash, ChevronDown, ChevronRight } from 'lucide-react';
import { ChecklistCategory, ChecklistQuestion, ChecklistAnswerOption } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

const CategoryTree = ({ 
    categories, 
    level = 0, 
    onAdd,
    onEdit,
    onDelete,
    onSelect,
    selectedCategoryId,
}: { 
    categories: ChecklistCategory[], 
    level?: number,
    onAdd: (parentId?: string) => void,
    onEdit: (category: ChecklistCategory) => void,
    onDelete: (categoryId: string) => void,
    onSelect: (categoryId: string) => void,
    selectedCategoryId: string | null,
}) => {
    return (
        <div className={cn(level > 0 && "pl-4", "w-full md:w-auto")}>
            {categories.map(cat => (
                <div key={cat.id}>
                    <div className={cn(
                        "flex items-center justify-between group py-1.5 px-2 rounded-md",
                        selectedCategoryId === cat.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                    )}>
                        <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => onSelect(cat.id)}
                        >
                            <span className="text-sm">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100">
                             {level < 2 && (
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onAdd(cat.id)}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(cat)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(cat.id)}>
                                <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    </div>
                     {cat.children && cat.children.length > 0 && (
                        <CategoryTree 
                            categories={cat.children} 
                            level={level + 1}
                            onAdd={onAdd}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onSelect={onSelect}
                            selectedCategoryId={selectedCategoryId}
                        />
                    )}
                </div>
            ))}
        </div>
    )
}

const QuestionEditorModal = ({ 
    isOpen, 
    onOpenChange,
    question: initialQuestion, 
    onSave,
    categories,
}: { 
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    question: Partial<ChecklistQuestion> | null; 
    onSave: (question: ChecklistQuestion) => void;
    categories: ChecklistCategory[];
}) => {
    const [question, setQuestion] = useState<Partial<ChecklistQuestion> | null>(null);
    const { toast } = useToast();

    React.useEffect(() => {
        if (isOpen && initialQuestion) {
            setQuestion(JSON.parse(JSON.stringify(initialQuestion)));
        }
    }, [isOpen, initialQuestion]);

    const handleSave = () => {
        if (!question?.label || !question?.categoryId || !question?.answerType) {
            toast({
                variant: 'destructive',
                title: "Missing fields",
                description: "Please fill out Label, Category, and Answer Type."
            })
            return;
        }
        onSave(question as ChecklistQuestion);
        onOpenChange(false);
    }
    
    if (!question) return null;

    const handleAnswerOptionChange = (index: number, field: keyof ChecklistAnswerOption, value: any) => {
        const newOptions = [...(question.answerOptions || [])];
        newOptions[index] = { ...newOptions[index], [field]: value };
        setQuestion({ ...question, answerOptions: newOptions });
    }

    const handleAddAnswerOption = () => {
        const newOption: ChecklistAnswerOption = { id: crypto.randomUUID(), label: `New Option` };
        setQuestion({ ...question, answerOptions: [...(question.answerOptions || []), newOption] });
    }

    const handleDeleteAnswerOption = (index: number) => {
        const newOptions = [...(question.answerOptions || [])];
        newOptions.splice(index, 1);
        setQuestion({ ...question, answerOptions: newOptions });
    }
    
    const catL1 = categories.find(c => c.id === question.categoryId);
    const catL2 = catL1?.children.find(c => c.id === question.subCategoryId);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg md:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{question.id ? 'Edit' : 'Add'} Checklist Question</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] p-1">
                    <div className="space-y-4 p-4">
                        <div className="space-y-2">
                            <Label htmlFor="q-label">Question Label</Label>
                            <Input id="q-label" value={question.label || ''} onChange={e => setQuestion({...question, label: e.target.value })} />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                             <div className="space-y-2">
                                <Label>Category (L1)</Label>
                                <Select value={question.categoryId || ''} onValueChange={id => setQuestion({...question, categoryId: id, subCategoryId: undefined, subSubCategoryId: undefined })}>
                                    <SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger>
                                    <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label>Sub-Category (L2)</Label>
                                <Select value={question.subCategoryId || ''} onValueChange={id => setQuestion({...question, subCategoryId: id, subSubCategoryId: undefined })} disabled={!catL1 || catL1.children.length === 0}>
                                    <SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger>
                                    <SelectContent>{catL1?.children.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label>Sub-Sub-Category (L3)</Label>
                                <Select value={question.subSubCategoryId || ''} onValueChange={id => setQuestion({...question, subSubCategoryId: id })} disabled={!catL2 || catL2.children.length === 0}>
                                    <SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger>
                                    <SelectContent>{catL2?.children.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Answer Type</Label>
                             <Select value={question.answerType || ''} onValueChange={type => setQuestion({...question, answerType: type as any })}>
                                <SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="single-select">Single Select</SelectItem>
                                    <SelectItem value="multi-select">Multi-Select</SelectItem>
                                    <SelectItem value="yes-no">Yes/No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {(question.answerType === 'single-select' || question.answerType === 'multi-select') && (
                            <div className="space-y-3 pt-3 border-t">
                                <Label className="font-medium">Answer Options</Label>
                                {question.answerOptions?.map((opt, index) => (
                                    <div key={opt.id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                                        <Input value={opt.label} onChange={e => handleAnswerOptionChange(index, 'label', e.target.value)} placeholder="Option label"/>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id={`comment-${opt.id}`} checked={opt.isCommentRequired} onCheckedChange={checked => handleAnswerOptionChange(index, 'isCommentRequired', checked)} />
                                            <Label htmlFor={`comment-${opt.id}`} className="text-xs">Comment?</Label>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteAnswerOption(index)}><Trash className="h-4 w-4 text-destructive"/></Button>
                                        {opt.isCommentRequired && <Input value={opt.commentPlaceholder || ''} onChange={e => handleAnswerOptionChange(index, 'commentPlaceholder', e.target.value)} placeholder="Comment placeholder... (optional)" className="col-span-3"/>}
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={handleAddAnswerOption}><Plus className="h-4 w-4 mr-2"/> Add Option</Button>
                            </div>
                        )}
                         {question.answerType === 'yes-no' && (
                            <div className="space-y-3 pt-3 border-t">
                                <Label className="font-medium">"No" Answer Configuration</Label>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="yesno-comment" checked={question.answerOptions?.find(o => o.id === 'no')?.isCommentRequired} onCheckedChange={checked => {
                                        const newOpts = question.answerOptions?.map(o => o.id === 'no' ? {...o, isCommentRequired: !!checked} : o) || [];
                                        setQuestion({...question, answerOptions: newOpts})
                                    }}/>
                                    <Label htmlFor="yesno-comment">Require comment on "No"</Label>
                                </div>
                                {question.answerOptions?.find(o => o.id === 'no')?.isCommentRequired && (
                                    <Input value={question.answerOptions?.find(o => o.id === 'no')?.commentPlaceholder || ''} onChange={e => {
                                        const newOpts = question.answerOptions?.map(o => o.id === 'no' ? {...o, commentPlaceholder: e.target.value} : o) || [];
                                        setQuestion({...question, answerOptions: newOpts})
                                    }} placeholder="Comment placeholder... (optional)"/>
                                )}
                            </div>
                         )}

                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Question</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const CategoryEditorModal = ({
    isOpen,
    onOpenChange,
    category: initialCategory,
    onSave,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    category: Partial<ChecklistCategory> | null;
    onSave: (category: Partial<ChecklistCategory>) => void;
}) => {
    const [name, setName] = useState('');
    
    React.useEffect(() => {
        if (isOpen && initialCategory) {
            setName(initialCategory.name || '');
        }
    }, [isOpen, initialCategory]);

    const handleSave = () => {
        if (initialCategory) {
            onSave({ ...initialCategory, name });
        }
        onOpenChange(false);
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{initialCategory?.id ? 'Edit' : 'Add'} Category</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="cat-name">Category Name</Label>
                    <Input id="cat-name" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function ChecklistPage() {
    const { state, dispatch } = useBuilder();
    const { checklistRepository } = state;
    const { toast } = useToast();

    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [editingQuestion, setEditingQuestion] = useState<Partial<ChecklistQuestion> | null>(null);
    const [editingCategory, setEditingCategory] = useState<Partial<ChecklistCategory> | null>(null);

    const handleSelectCategory = (categoryId: string) => {
        setSelectedCategoryId(prev => prev === categoryId ? null : categoryId);
    }
    
    // Category Handlers
    const handleAddCategory = (parentId?: string) => {
        setEditingCategory({ parentId }); // Use parentId to determine level
    }
    const handleEditCategory = (category: ChecklistCategory) => {
        setEditingCategory(category);
    }
    const handleDeleteCategory = (categoryId: string) => {
        dispatch({ type: "DELETE_CHECKLIST_CATEGORY", payload: { categoryId } });
        toast({ title: 'Category Deleted' });
    }
    const handleSaveCategory = (category: Partial<ChecklistCategory>) => {
        dispatch({ type: "SAVE_CHECKLIST_CATEGORY", payload: category });
        toast({ title: 'Category Saved' });
    }

    // Question Handlers
    const handleAddQuestion = () => {
        let catId: string | undefined, subId: string | undefined, subSubId: string | undefined;

        if (selectedCategoryId) {
            const findCategoryPath = (id: string, categories: ChecklistCategory[], path: ChecklistCategory[] = []): ChecklistCategory[] | null => {
                for (const cat of categories) {
                    const currentPath = [...path, cat];
                    if (cat.id === id) {
                        return currentPath;
                    }
                    if (cat.children && cat.children.length > 0) {
                        const found = findCategoryPath(id, cat.children, currentPath);
                        if (found) return found;
                    }
                }
                return null;
            }
            const path = findCategoryPath(selectedCategoryId, checklistRepository.categories);
            if (path) {
                catId = path[0]?.id;
                subId = path[1]?.id;
                subSubId = path[2]?.id;
            }
        }
        
        setEditingQuestion({
            categoryId: catId,
            subCategoryId: subId,
            subSubCategoryId: subSubId,
            answerOptions: [],
        });
    }

    const handleEditQuestion = (question: ChecklistQuestion) => {
        setEditingQuestion(question);
    }
    const handleDeleteQuestion = (questionId: string) => {
        dispatch({ type: "DELETE_CHECKLIST_QUESTION", payload: { questionId } });
        toast({ title: 'Question Deleted' });
    }
    const handleSaveQuestion = (question: ChecklistQuestion) => {
        // Fix for Yes/No options
        if (question.answerType === 'yes-no') {
            const yesOption = question.answerOptions.find(o => o.id === 'yes') || { id: 'yes', label: 'Yes' };
            const noOption = question.answerOptions.find(o => o.id === 'no') || { id: 'no', label: 'No' };
            question.answerOptions = [yesOption, noOption];
        }
        dispatch({ type: "SAVE_CHECKLIST_QUESTION", payload: question });
        toast({ title: 'Question Saved' });
    }
    
    const questionsToShow = useMemo(() => {
        if (!selectedCategoryId) {
            return checklistRepository.questions;
        }

        const idsToShow = new Set<string>();
        
        const findAndCollectIds = (categories: ChecklistCategory[], targetId: string): boolean => {
            for (const category of categories) {
                if (category.id === targetId) {
                    const collect = (cat: ChecklistCategory) => {
                        idsToShow.add(cat.id);
                        cat.children.forEach(collect);
                    };
                    collect(category);
                    return true;
                }
                if (category.children && findAndCollectIds(category.children, targetId)) {
                    return true;
                }
            }
            return false;
        };

        findAndCollectIds(checklistRepository.categories, selectedCategoryId);

        if (idsToShow.size === 0) {
             idsToShow.add(selectedCategoryId);
        }

        return checklistRepository.questions.filter(q => {
            const mostSpecificCatId = q.subSubCategoryId || q.subCategoryId || q.categoryId;
            return idsToShow.has(mostSpecificCatId);
        });
    }, [selectedCategoryId, checklistRepository.categories, checklistRepository.questions]);


    return (
        <div className="h-full flex flex-col md:flex-row">
            <aside className="w-full md:w-1/3 border-b md:border-b-0 md:border-r h-auto md:h-full overflow-y-auto">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-semibold">Categories</h3>
                    <Button variant="outline" size="sm" onClick={() => handleAddCategory()}>
                        <Plus className="h-4 w-4 mr-2" /> Add L1
                    </Button>
                </div>
                <div className="p-2">
                    <CategoryTree 
                        categories={checklistRepository.categories}
                        onAdd={handleAddCategory}
                        onEdit={handleEditCategory}
                        onDelete={handleDeleteCategory}
                        onSelect={handleSelectCategory}
                        selectedCategoryId={selectedCategoryId}
                    />
                </div>
            </aside>
            <main className="w-full md:w-2/3 h-full flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-semibold">Questions</h3>
                    <Button variant="outline" size="sm" onClick={handleAddQuestion}>
                        <Plus className="h-4 w-4 mr-2" /> Add Question
                    </Button>
                </div>
                 <ScrollArea>
                    <div className="p-4 space-y-2">
                        {questionsToShow.map(q => (
                            <Card key={q.id}>
                                <CardContent className="p-3 flex justify-between items-center group">
                                    <span className="text-sm">{q.label}</span>
                                     <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditQuestion(q)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteQuestion(q.id)}>
                                            <Trash className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                         {questionsToShow.length === 0 && (
                            <div className="text-center text-muted-foreground py-12">
                                <p>No questions found.</p>
                                <p className="text-xs">Select a category or add a new question.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </main>
            <QuestionEditorModal
                isOpen={!!editingQuestion}
                onOpenChange={() => setEditingQuestion(null)}
                question={editingQuestion}
                onSave={handleSaveQuestion}
                categories={checklistRepository.categories}
            />
             <CategoryEditorModal
                isOpen={!!editingCategory}
                onOpenChange={() => setEditingCategory(null)}
                category={editingCategory}
                onSave={handleSaveCategory}
            />
        </div>
    );
}


    

    