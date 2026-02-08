
'use client';

import { useBuilder } from '@/hooks/use-builder';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChecklistCategory, Task, TaskType } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';
import { CategorySelector } from '@/components/tasks/CategorySelector';
import { RoomEntry } from '@/components/tasks/RoomEntry';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppHeader } from '@/components/app-header';

type Props = {
    params: { taskId: string };
};

export default function ExecuteTaskPage({ params }: Props) {
    const { state, dispatch } = useBuilder();
    const { taskId } = params;
    const router = useRouter();

    const [task, setTask] = useState<Task | null>(null);
    const [taskType, setTaskType] = useState<TaskType | null>(null);
    const [allCategories, setAllCategories] = useState<ChecklistCategory[]>([]);

    useEffect(() => {
        const foundTask = state.tasks.find(t => t.id === taskId);
        if (foundTask) {
            setTask(foundTask);
            const foundTaskType = state.taskTypes.find(tt => tt.id === foundTask.taskTypeId);
            setTaskType(foundTaskType || null);
        } else {
            // Task not found, maybe redirect
        }
        setAllCategories(state.checklistRepository.categories);
    }, [taskId, state.tasks, state.taskTypes, state.checklistRepository.categories]);

    const handleCategorySelection = (selectedIds: string[]) => {
        if (!task) return;
        const updatedTask = { ...task, selectedCategoryIds: selectedIds };
        setTask(updatedTask);
        // Persist this change
        dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
    };

    const handleUpdateTask = (updatedTask: Task) => {
        setTask(updatedTask);
        dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
    }

    const availableCategories = useMemo(() => {
        if (!taskType || !allCategories) return [];
        const allowed = new Set(taskType.allowedCategoryIds);
        return allCategories.filter(cat => allowed.has(cat.id));
    }, [taskType, allCategories]);


    if (!task || !taskType) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>Loading task...</p>
            </div>
        );
    }
    
    // Step 1: Category Selection (if applicable)
    if (taskType.categorySelection === 'multiple' && !task.selectedCategoryIds) {
        return (
            <CategorySelector
                availableCategories={availableCategories}
                onSelect={handleCategorySelection}
            />
        );
    }

    const categoriesToRender = task.selectedCategoryIds
        ? availableCategories.filter(cat => task.selectedCategoryIds?.includes(cat.id))
        : availableCategories;

    const renderContent = () => {
        // Step 2: Render UI based on layout
        if (taskType.uiLayout === 'tabs') {
            return (
                <Tabs defaultValue={categoriesToRender[0]?.id} className="w-full p-4">
                    <TabsList>
                        {categoriesToRender.map(cat => (
                            <TabsTrigger key={cat.id} value={cat.id}>
                                {cat.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {categoriesToRender.map(cat => (
                        <TabsContent key={cat.id} value={cat.id}>
                            <RoomEntry
                                task={task}
                                taskType={taskType}
                                categoryId={cat.id}
                                onUpdateTask={handleUpdateTask}
                            />
                        </TabsContent>
                    ))}
                </Tabs>
            );
        } else { // single-table layout
            const category = categoriesToRender[0];
            if (!category) return <p>No category configured for this task.</p>;
            return (
                <div className="p-4">
                     <RoomEntry
                        task={task}
                        taskType={taskType}
                        categoryId={category.id}
                        onUpdateTask={handleUpdateTask}
                    />
                </div>
            );
        }
    };

    return (
        <div className="h-full flex flex-col">
            <header className="p-4 border-b flex items-center gap-4">
                 <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-xl font-bold">{taskType.name}</h1>
                    <p className="text-sm text-muted-foreground">Site: {state.sites.find(s => s.id === task.siteId)?.name}</p>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
}

