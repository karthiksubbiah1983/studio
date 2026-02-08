
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { Task, TaskType, RoomEntry as RoomEntryType } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Checklist } from './Checklist';

type Props = {
    task: Task;
    taskType: TaskType;
    categoryId: string;
    onUpdateTask: (updatedTask: Task) => void;
};

export function RoomEntry({ task, taskType, categoryId, onUpdateTask }: Props) {
    const { user } = useAuth();
    const [newEntryLabel, setNewEntryLabel] = useState('');
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

    const entriesForCategory = task.entries?.filter(e => e.categoryId === categoryId) || [];

    const handleAddEntry = () => {
        if (!newEntryLabel.trim() || !user) return;
        const newEntry: RoomEntryType = {
            id: crypto.randomUUID(),
            label: newEntryLabel,
            timestamp: new Date().toISOString(),
            userId: user.uid,
            userName: user.username || user.email || 'Unknown User',
            categoryId,
        };

        const updatedTask = {
            ...task,
            entries: [...(task.entries || []), newEntry],
        };
        onUpdateTask(updatedTask);
        setNewEntryLabel('');
        setSelectedEntryId(newEntry.id); // Automatically select the new entry
    };

    const handleUpdateChecklistData = (entryId: string, checklistData: any) => {
        const updatedEntries = task.entries?.map(entry =>
            entry.id === entryId ? { ...entry, checklistData } : entry
        );
        onUpdateTask({ ...task, entries: updatedEntries });
        setSelectedEntryId(null); // Close the checklist view after saving
    }

    if (selectedEntryId) {
        const selectedEntry = entriesForCategory.find(e => e.id === selectedEntryId);
        if (selectedEntry) {
            return (
                <Checklist
                    taskTypeId={task.taskTypeId}
                    categoryId={categoryId}
                    value={selectedEntry.checklistData}
                    onChange={(data) => handleUpdateChecklistData(selectedEntryId, data)}
                    onBack={() => setSelectedEntryId(null)}
                />
            );
        }
    }

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Input
                        placeholder={taskType.roomEntryLabel || 'Enter label...'}
                        value={newEntryLabel}
                        onChange={(e) => setNewEntryLabel(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddEntry() }}
                    />
                    <Button onClick={handleAddEntry} disabled={!newEntryLabel.trim()}>
                        <Plus className="mr-2 h-4 w-4" /> Add
                    </Button>
                </div>

                <div className="border rounded-lg">
                    <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] items-center p-4 border-b font-medium text-sm text-muted-foreground">
                        <div>{taskType.roomEntryLabel || 'Label'}</div>
                        <div>User</div>
                        <div>Timestamp</div>
                        <div className="text-right">Actions</div>
                    </div>
                    <div className="divide-y">
                        {entriesForCategory.length > 0 ? (
                            entriesForCategory.map(entry => (
                                <div key={entry.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] items-center p-4 gap-4 md:gap-2">
                                    <div className="font-medium">{entry.label}</div>
                                    <div><span className="md:hidden font-medium mr-2">User:</span> {entry.userName}</div>
                                    <div><span className="md:hidden font-medium mr-2">Time:</span> {format(new Date(entry.timestamp), 'p')}</div>
                                    <div className="flex justify-end">
                                        <Button variant="outline" size="sm" onClick={() => setSelectedEntryId(entry.id)}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            {entry.checklistData ? 'Edit Checklist' : 'Start Checklist'}
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-24 text-center flex items-center justify-center text-muted-foreground">
                                No entries added for this category yet.
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

