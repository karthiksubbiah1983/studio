
"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Plus, Trash, ArrowRight, Settings } from "lucide-react";
import { Badge } from "../ui/badge";

type State = {
    id: string;
    name: string;
    description: string;
}

export function StateMachineEditor() {
    const [states, setStates] = useState<State[]>([
        { id: 'open', name: 'Open', description: 'Initial state of a new task.' },
        { id: 'in_progress', name: 'In Progress', description: 'Task is being worked on.' },
        { id: 'resolved', name: 'Resolved', description: 'Work is complete.' },
    ]);
    const [newStateName, setNewStateName] = useState("");

    const handleAddState = () => {
        if (!newStateName.trim()) return;
        const newState: State = {
            id: newStateName.trim().toLowerCase().replace(/\s+/g, '_'),
            name: newStateName.trim(),
            description: ""
        };
        setStates([...states, newState]);
        setNewStateName("");
    }
    
    return (
        <div className="flex h-full w-full bg-background rounded-lg">
            <aside className="w-1/4 border-r p-4 space-y-4">
                <h3 className="font-semibold text-lg">States</h3>
                <p className="text-xs text-muted-foreground">Define the different statuses or stages in your workflow.</p>
                <div className="flex gap-2">
                    <Input 
                        placeholder="New state name..."
                        value={newStateName}
                        onChange={(e) => setNewStateName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddState()}
                    />
                    <Button onClick={handleAddState} size="sm">Add</Button>
                </div>
                <div className="space-y-2">
                    {states.map(state => (
                        <Card key={state.id} className="p-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">{state.name}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <Trash className="h-4 w-4 text-destructive/70"/>
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </aside>
            <main className="flex-1 p-8">
                <h3 className="font-semibold text-lg">Workflow Canvas</h3>
                <p className="text-xs text-muted-foreground mb-4">Visually connect states to define the workflow sequence and set rules for each transition.</p>

                <div className="relative flex flex-col items-center justify-center gap-8 bg-dot-pattern h-full rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                        <Card className="w-48 shadow-lg">
                            <CardHeader className="p-3">
                                <CardTitle className="text-base">Open</CardTitle>
                            </CardHeader>
                        </Card>

                         <div className="group relative flex flex-col items-center">
                            <ArrowRight className="h-8 w-8 text-muted-foreground" />
                            <Button variant="outline" size="icon" className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Settings className="h-4 w-4" />
                            </Button>
                            <Badge variant="secondary" className="mt-1">On Assign</Badge>
                        </div>
                        

                        <Card className="w-48 shadow-lg">
                            <CardHeader className="p-3">
                                <CardTitle className="text-base">In Progress</CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    <div className="flex items-center gap-4">
                        <Card className="w-48 shadow-lg">
                             <CardHeader className="p-3">
                                <CardTitle className="text-base">Resolved</CardTitle>
                            </CardHeader>
                        </Card>
                         <div className="group relative flex flex-col items-center">
                            <ArrowRight className="h-8 w-8 text-muted-foreground" />
                             <Button variant="outline" size="icon" className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Settings className="h-4 w-4" />
                            </Button>
                            <Badge variant="secondary" className="mt-1">On QA Verify</Badge>
                        </div>
                        <Card className="w-48 shadow-lg">
                             <CardHeader className="p-3">
                                <CardTitle className="text-base">Closed</CardTitle>
                            </CardHeader>
                        </Card>
                    </div>
                     <div className="absolute top-4 right-4">
                        <Button variant="outline"><Plus className="mr-2 h-4 w-4"/> Add Transition</Button>
                     </div>
                </div>

            </main>
            <style jsx>{`
                .bg-dot-pattern {
                    background-image: radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px);
                    background-size: 20px 20px;
                }
            `}</style>
        </div>
    )
}
