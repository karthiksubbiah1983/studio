
"use client";

import React, { useState, useEffect } from 'react';
import { useBuilder } from '@/hooks/use-builder';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash, Edit } from 'lucide-react';
import { TaskType, ChecklistRepository, ChecklistCategory, ChecklistQuestion, TaskTypeConfiguration } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const TaskTypeEditor = ({ taskType, onSave, onCancel }: { taskType: TaskType | null, onSave: (name: string, id?: string) => void, onCancel: () => void }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (taskType) {
            setName(taskType.name);
        } else {
            setName('');
        }
    }, [taskType]);

    const handleSave = () => {
        onSave(name, taskType?.id);
    }

    return (
        <Dialog open={!!taskType} onOpenChange={onCancel}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{taskType?.id ? 'Edit' : 'Add'} Task Type</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="tt-name">Task Type Name</Label>
                    <Input id="tt-name" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const ChecklistConfigurator = ({ 
    checklistRepository, 
    config, 
    onConfigChange 
}: { 
    checklistRepository: ChecklistRepository,
    config: TaskTypeConfiguration,
    onConfigChange: (newConfig: TaskTypeConfiguration) => void 
}) => {

    const handleCategoryToggle = (catId: string, checked: boolean) => {
        let newEnabledCategoryIds = [...config.enabledCategoryIds];
        const cat = findCategory(checklistRepository.categories, catId);
        if (!cat) return;

        const allChildIds = (c: ChecklistCategory): string[] => [c.id, ...c.children.flatMap(allChildIds)];
        const idsToToggle = allChildIds(cat);

        if (checked) {
            newEnabledCategoryIds = [...newEnabledCategoryIds, ...idsToToggle];
        } else {
            newEnabledCategoryIds = newEnabledCategoryIds.filter(id => !idsToToggle.includes(id));
        }

        // Also toggle questions within these categories
        const questionsToToggle = checklistRepository.questions.filter(q => 
            idsToToggle.includes(q.categoryId) || (q.subCategoryId && idsToToggle.includes(q.subCategoryId)) || (q.subSubCategoryId && idsToToggle.includes(q.subSubCategoryId))
        ).map(q => q.id);

        let newEnabledQuestionIds = [...config.enabledQuestionIds];
        if(checked) {
            newEnabledQuestionIds = [...newEnabledQuestionIds, ...questionsToToggle];
        } else {
            newEnabledQuestionIds = newEnabledQuestionIds.filter(id => !questionsToToggle.includes(id));
        }

        onConfigChange({ ...config, enabledCategoryIds: [...new Set(newEnabledCategoryIds)], enabledQuestionIds: [...new Set(newEnabledQuestionIds)] });
    };
    
    const handleQuestionToggle = (questionId: string, checked: boolean) => {
         onConfigChange({ 
            ...config, 
            enabledQuestionIds: checked 
                ? [...config.enabledQuestionIds, questionId] 
                : config.enabledQuestionIds.filter(id => id !== questionId) 
        });
    }
    
    const findCategory = (categories: ChecklistCategory[], id: string): ChecklistCategory | null => {
        for (const cat of categories) {
            if (cat.id === id) return cat;
            if (cat.children) {
                const found = findCategory(cat.children, id);
                if (found) return found;
            }
        }
        return null;
    };
    
    const renderCategory = (cat: ChecklistCategory, level = 0) => {
        const isChecked = config.enabledCategoryIds.includes(cat.id);
        const questions = checklistRepository.questions.filter(q => 
            (level === 0 && q.categoryId === cat.id && !q.subCategoryId) ||
            (level === 1 && q.subCategoryId === cat.id && !q.subSubCategoryId) ||
            (level === 2 && q.subSubCategoryId === cat.id)
        );

        return (
            <div key={cat.id} className={`pl-${level * 4}`}>
                <div className="flex items-center space-x-2 py-1">
                    <Checkbox id={`cat-${cat.id}`} checked={isChecked} onCheckedChange={(checked) => handleCategoryToggle(cat.id, !!checked)} />
                    <Label htmlFor={`cat-${cat.id}`} className="font-semibold">{cat.name}</Label>
                </div>
                <div className={`pl-6 space-y-1 mt-1`}>
                    {questions.map(q => (
                        <div key={q.id} className="flex items-center space-x-2">
                            <Checkbox id={`q-${q.id}`} checked={config.enabledQuestionIds.includes(q.id)} onCheckedChange={(checked) => handleQuestionToggle(q.id, !!checked)} />
                            <Label htmlFor={`q-${q.id}`} className="font-normal text-sm">{q.label}</Label>
                        </div>
                    ))}
                    {cat.children.map(child => renderCategory(child, level + 1))}
                </div>
            </div>
        )
    };

    return (
        <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
                {checklistRepository.categories.map(cat => renderCategory(cat))}
            </div>
        </ScrollArea>
    )
}

export default function TaskTypesPage() {
    const { state, dispatch } = useBuilder();
    const { taskTypes, taskTypeConfigurations, checklistRepository } = state;
    const { toast } = useToast();

    const [selectedTaskTypeId, setSelectedTaskTypeId] = useState<string | null>(null);
    const [editingTaskType, setEditingTaskType] = useState<TaskType | null>(null);
    
    useEffect(() => {
        if (taskTypes.length > 0 && !selectedTaskTypeId) {
            setSelectedTaskTypeId(taskTypes[0].id);
        }
    }, [taskTypes, selectedTaskTypeId]);

    const handleSaveTaskType = (name: string, id?: string) => {
        if (!name.trim()) return;
        const actionType = id ? 'UPDATE_TASK_TYPE' : 'ADD_TASK_TYPE';
        const payload = id ? { id, name } : { name };
        dispatch({ type: actionType, payload: payload as any });
        toast({ title: `Task Type ${id ? 'Updated' : 'Added'}` });
        setEditingTaskType(null);
    };

    const handleDeleteTaskType = (id: string) => {
        dispatch({ type: 'DELETE_TASK_TYPE', payload: { id } });
        toast({ title: 'Task Type Deleted', variant: 'destructive' });
        if (selectedTaskTypeId === id) {
            setSelectedTaskTypeId(null);
        }
    }
    
    const handleConfigChange = (newConfig: TaskTypeConfiguration) => {
        dispatch({ type: 'UPDATE_TASK_TYPE_CONFIG', payload: newConfig });
    }

    const selectedConfig = taskTypeConfigurations.find(c => c.taskTypeId === selectedTaskTypeId);
    
    return (
        <div className="h-full flex flex-col md:flex-row">
            <aside className="w-full md:w-1/3 border-b md:border-b-0 md:border-r h-auto md:h-full overflow-y-auto">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-semibold">Task Types</h3>
                    <Button variant="outline" size="sm" onClick={() => setEditingTaskType({} as TaskType)}>
                        <Plus className="h-4 w-4 mr-2" /> Add
                    </Button>
                </div>
                <div className="p-2">
                     {taskTypes.map(tt => (
                        <div key={tt.id} className="flex items-center justify-between group py-1.5 px-2 rounded-md hover:bg-accent/50">
                            <div className="flex-1 cursor-pointer" onClick={() => setSelectedTaskTypeId(tt.id)}>
                                <span className="text-sm">{tt.name}</span>
                            </div>
                            <div className="flex items-center gap-1 md:opacity-0 group-hover:opacity-100">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingTaskType(tt)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteTaskType(tt.id)}><Trash className="h-4 w-4 text-destructive" /></Button>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>
            <main className="w-full md:w-2/3 h-full flex flex-col">
                <div className="p-4 border-b">
                    <h3 className="font-semibold">Checklist Configuration</h3>
                    <p className="text-sm text-muted-foreground">
                        Enable or disable categories and questions for the selected task type.
                    </p>
                </div>
                {selectedConfig ? (
                    <ChecklistConfigurator 
                        checklistRepository={checklistRepository} 
                        config={selectedConfig}
                        onConfigChange={handleConfigChange}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <p>Select a task type to configure its checklist.</p>
                    </div>
                )}
            </main>
             <TaskTypeEditor 
                taskType={editingTaskType}
                onSave={handleSaveTaskType}
                onCancel={() => setEditingTaskType(null)}
            />
        </div>
    );
}

