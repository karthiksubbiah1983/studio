

"use client";

import { useMemo, useState, useEffect } from "react";
import { useBuilder } from "@/hooks/use-builder";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { FormElementInstance, Workflow, Section, Condition, WorkflowAction, TaskStatus } from "@/lib/types";
import { Plus, Trash, X, Zap, GitCommitHorizontal } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { cn, findElementRecursive, getAllElements } from "@/lib/utils";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { Textarea } from "../ui/textarea";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const taskStatuses: TaskStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed', 'Escalated'];
const taskTypes: string[] = ['Follow-up Call', 'Send Email', 'Review Request'];
const mailFormats: string[] = ['Welcome Email', 'Order Confirmation', 'Password Reset'];

export function WorkflowsDialog({ isOpen, onOpenChange }: Props) {
  const { sections, workflows, updateWorkflows } = useBuilder();
  const [localWorkflows, setLocalWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
        const initialWorkflows = JSON.parse(JSON.stringify(workflows || []));
        setLocalWorkflows(initialWorkflows);

        const stillExists = initialWorkflows.some((w: Workflow) => w.id === selectedWorkflowId);
        
        if (initialWorkflows.length > 0 && !stillExists) {
            setSelectedWorkflowId(initialWorkflows[0].id);
        } else if (initialWorkflows.length === 0) {
            setSelectedWorkflowId(null);
        }
    }
  }, [isOpen, workflows, selectedWorkflowId]);

  const allElementsAndSections = useMemo(() => getAllElements(sections), [sections]);
  
  const selectedWorkflow = localWorkflows.find(w => w.id === selectedWorkflowId);

  const handleAddWorkflow = () => {
    const newWorkflow: Workflow = {
      id: crypto.randomUUID(),
      name: `Workflow ${localWorkflows.length + 1}`,
      conditions: [{
        id: crypto.randomUUID(),
        sourceElementId: "",
        operator: 'equals',
        comparisonType: 'static_value',
        value: ""
      }],
      logicType: 'and',
      actions: [{
        id: crypto.randomUUID(),
        type: 'CREATE_TASK',
        payload: { taskType: taskTypes[0] }
      }]
    };
    const newWorkflows = [...localWorkflows, newWorkflow];
    setLocalWorkflows(newWorkflows);
    setSelectedWorkflowId(newWorkflow.id);
  };

  const handleSelectWorkflow = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
  }

  const handleUpdateWorkflow = (updatedWorkflow: Workflow) => {
    const newWorkflows = localWorkflows.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w);
    setLocalWorkflows(newWorkflows);
  };

  const handleDeleteWorkflow = (workflowId: string) => {
    const newWorkflows = localWorkflows.filter(w => w.id !== workflowId);
    setLocalWorkflows(newWorkflows);
    if (selectedWorkflowId === workflowId) {
      setSelectedWorkflowId(newWorkflows.length > 0 ? newWorkflows[0].id : null);
    }
  };

  const handleSaveChanges = () => {
    updateWorkflows(localWorkflows);
    onOpenChange(false);
  }

  const ConditionEditor = ({ condition, workflow }: { condition: Condition, workflow: Workflow }) => {
    const [sourceElement, setSourceElement] = useState<FormElementInstance | Section | null>(null);
    const [comparisonElement, setComparisonElement] = useState<FormElementInstance | Section | null>(null);
    
    useEffect(() => {
        if (condition.sourceElementId) {
            const el = allElementsAndSections.find(el => el.id === condition.sourceElementId) || null;
            setSourceElement(el as FormElementInstance | Section | null);
        } else {
            setSourceElement(null);
        }
        if (condition.comparisonElementId) {
            const el = allElementsAndSections.find(el => el.id === condition.comparisonElementId) || null;
            setComparisonElement(el as FormElementInstance | Section | null);
        } else {
            setComparisonElement(null);
        }
    }, [condition.sourceElementId, condition.comparisonElementId, allElementsAndSections]);

    const handleUpdateCondition = (updatedCondition: Partial<Condition>) => {
        const updatedRule = {
            ...workflow,
            conditions: workflow.conditions.map(c => c.id === condition.id ? { ...c, ...updatedCondition } : c)
        };
        handleUpdateWorkflow(updatedRule);
    }

    const handleDeleteCondition = () => {
        const updatedWorkflow = {
            ...workflow,
            conditions: workflow.conditions.filter(c => c.id !== condition.id)
        };
        handleUpdateWorkflow(updatedWorkflow);
    }
    
    const getSourceElementOptions = (): string[] => {
        if (!sourceElement || !('type' in sourceElement)) return [];
        if (sourceElement.type === 'Select' || sourceElement.type === 'RadioGroup') return sourceElement.options || [];
        if (sourceElement.type === 'Checkbox') return ['true', 'false'];
        return [];
    }

    const showOptionsDropdown = sourceElement && ('type' in sourceElement) && (sourceElement.type === 'Select' || sourceElement.type === 'RadioGroup' || sourceElement.type === 'Checkbox') && condition.comparisonType === 'static_value';
    
    const isDateRelated = (element: FormElementInstance | Section | null) => {
        if (!element) return false;
        if ('type' in element) return element.type === 'DatePicker';
        return false;
    }
    const isSpecialDate = (id: string | undefined) => id && id.startsWith('_');

    const shouldShowDateOffset = isSpecialDate(condition.sourceElementId) || isDateRelated(sourceElement) || (condition.comparisonType === 'another_field' && (isSpecialDate(condition.comparisonElementId) || isDateRelated(comparisonElement)));


    const specialDateOptions = (
        <>
            <SelectItem value="_current_date">Current Date</SelectItem>
            <SelectItem value="_due_date">Due Date</SelectItem>
            <SelectItem value="_scheduled_date">Scheduled Date</SelectItem>
        </>
    );

    return (
        <div className="border bg-background/50 p-3 rounded-md space-y-3 relative">
            {workflow.conditions.length > 1 && (
            <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-5 w-5" onClick={handleDeleteCondition}>
                <X className="h-3 w-3 text-destructive/70" />
            </Button>
            )}
            <div className="space-y-1">
                <Label className="text-xs">Source Field</Label>
                <Select value={condition.sourceElementId} onValueChange={(value) => handleUpdateCondition({ sourceElementId: value })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select a source field..." /></SelectTrigger>
                    <SelectContent>
                        {specialDateOptions}
                        <Separator className="my-1"/>
                        {allElementsAndSections.map(el => ('key' in el && el.key) ? 
                          <SelectItem key={el.id} value={el.id}>{el.label}</SelectItem> : 
                          <SelectItem key={el.id} value={el.id}>{el.title} (Section)</SelectItem>
                        )}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex-1 space-y-1">
                    <Label className="text-xs">Operator</Label>
                    <Select value={condition.operator} onValueChange={(value) => handleUpdateCondition({ operator: value as Condition['operator'] })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="not_equals">Not Equals</SelectItem>
                            <SelectItem value="is_greater_than">Is Greater Than</SelectItem>
                            <SelectItem value="is_less_than">Is Less Than</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="not_contains">Does Not Contain</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="pt-5"><GitCommitHorizontal className="h-4 w-4 text-muted-foreground" /></div>
                <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs">Compare To</Label>
                        <RadioGroup value={condition.comparisonType} onValueChange={(value) => handleUpdateCondition({ comparisonType: value as 'static_value' | 'another_field', value: '', comparisonElementId: undefined })} className="flex">
                            <div className="flex items-center space-x-1"><RadioGroupItem value="static_value" id={`static-${condition.id}`} className="h-3 w-3" /><Label htmlFor={`static-${condition.id}`} className="text-xs">Value</Label></div>
                            <div className="flex items-center space-x-1"><RadioGroupItem value="another_field" id={`field-${condition.id}`} className="h-3 w-3" /><Label htmlFor={`field-${condition.id}`} className="text-xs">Field</Label></div>
                        </RadioGroup>
                    </div>
                    {condition.comparisonType === 'static_value' ? (
                       showOptionsDropdown ? (
                            <Select value={condition.value} onValueChange={(value) => handleUpdateCondition({ value: value })}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select an option..." /></SelectTrigger>
                                <SelectContent>{getSourceElementOptions().map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                            </Select>
                       ) : ( <Input placeholder="Value" value={condition.value} onChange={(e) => handleUpdateCondition({ value: e.target.value })} className="h-8 text-xs" />)
                    ) : (
                        <Select value={condition.comparisonElementId} onValueChange={(value) => handleUpdateCondition({ comparisonElementId: value })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select a field..." /></SelectTrigger>
                            <SelectContent>
                                {specialDateOptions}
                                <Separator className="my-1"/>
                                {allElementsAndSections.map(el => ('key' in el && el.key) ? 
                                  <SelectItem key={el.id} value={el.id}>{el.label}</SelectItem> :
                                  <SelectItem key={el.id} value={el.id}>{el.title} (Section)</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>
             {shouldShowDateOffset && (
                <div className="flex items-end gap-2">
                    <div className="w-1/2 space-y-1">
                        <Label className="text-xs">Offset (days)</Label>
                        <Input
                            type="number"
                            placeholder="e.g., 2 or -2"
                            value={condition.offsetDays || ''}
                            onChange={(e) => handleUpdateCondition({ offsetDays: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                            className="h-8 text-xs"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground pb-1">Offset is added to the comparison value.</p>
                </div>
            )}
        </div>
    )
  }

  const ActionEditor = ({ action, workflow }: { action: (WorkflowAction & { id: string }), workflow: Workflow }) => {
    
    const handleUpdateAction = (updatedAction: Partial<WorkflowAction & { id: string }>) => {
      const newActions = workflow.actions.map(a => a.id === action.id ? { ...a, ...updatedAction } : a);
      handleUpdateWorkflow({ ...workflow, actions: newActions });
    }

    const handleUpdateActionPayload = (updatedPayload: Partial<WorkflowAction['payload']>) => {
        const newPayload = { ...action.payload, ...updatedPayload };
        handleUpdateAction({ ...action, payload: newPayload });
    }

    const handleDeleteAction = () => {
        const newActions = workflow.actions.filter(a => a.id !== action.id);
        handleUpdateWorkflow({ ...workflow, actions: newActions });
    }

    return (
        <div className="space-y-3 p-3 border rounded-lg bg-accent/20 relative">
             {workflow.actions.length > 1 && (
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-5 w-5" onClick={handleDeleteAction}>
                    <X className="h-3 w-3 text-destructive/70" />
                </Button>
            )}
            <div className="space-y-2">
                <Label className="text-xs">Action</Label>
                <Select value={action.type} onValueChange={(value) => {
                     let payload: WorkflowAction['payload'];
                    if (value === 'CREATE_TASK') {
                        payload = { taskType: taskTypes[0] };
                    } else if (value === 'SET_TASK_STATUS') {
                        payload = { status: 'Open' };
                    } else { // CONFIGURE_MAIL
                        payload = { mailFormat: mailFormats[0] }
                    }
                    handleUpdateAction({ type: value as WorkflowAction['type'], payload: payload as any });
                }}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="CREATE_TASK">Create Follow-up Task</SelectItem>
                        <SelectItem value="SET_TASK_STATUS">Set Task Status</SelectItem>
                        <SelectItem value="CONFIGURE_MAIL">Configure Mail</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {action.type === 'CREATE_TASK' && (
                <div className="space-y-2">
                    <Label className="text-xs">Task Type</Label>
                    <Select value={action.payload.taskType} onValueChange={(value) => handleUpdateActionPayload({ taskType: value })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {taskTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            {action.type === 'SET_TASK_STATUS' && (
                <div className="space-y-2">
                     <Label className="text-xs">Status</Label>
                     <Select value={action.payload.status} onValueChange={(value) => handleUpdateActionPayload({ status: value as TaskStatus })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {taskStatuses.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            {action.type === 'CONFIGURE_MAIL' && (
                <div className="space-y-2">
                     <Label className="text-xs">Mail Format</Label>
                     <Select value={action.payload.mailFormat} onValueChange={(value) => handleUpdateActionPayload({ mailFormat: value })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {mailFormats.map(format => (
                                <SelectItem key={format} value={format}>{format}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
    )
  }

  const WorkflowEditor = ({ workflow }: { workflow: Workflow }) => {

    const handleAddAction = () => {
        const newAction: WorkflowAction & { id: string } = {
            id: crypto.randomUUID(),
            type: 'CREATE_TASK',
            payload: { taskType: taskTypes[0] }
        };
        handleUpdateWorkflow({ ...workflow, actions: [...workflow.actions, newAction] });
    }

    const handleAddCondition = () => {
        const newCondition: Condition = { id: crypto.randomUUID(), sourceElementId: "", operator: 'equals', comparisonType: 'static_value', value: "" };
        handleUpdateWorkflow({ ...workflow, conditions: [...workflow.conditions, newCondition] });
    }

    return (
        <div className="p-4 space-y-4">
            <Input value={workflow.name} onChange={(e) => handleUpdateWorkflow({ ...workflow, name: e.target.value })} className="text-lg font-medium" />
            <Separator />
            <h4 className="font-medium text-sm text-muted-foreground flex items-center">
                IF
                <RadioGroup value={workflow.logicType} onValueChange={(value) => handleUpdateWorkflow({ ...workflow, logicType: value as 'and' | 'or' })} className="flex ml-2">
                    <div className="flex items-center space-x-1"><RadioGroupItem value="and" id={`and-${workflow.id}`} className="h-4 w-4" /><Label htmlFor={`and-${workflow.id}`} className="text-sm">All (AND)</Label></div>
                    <div className="flex items-center space-x-1"><RadioGroupItem value="or" id={`or-${workflow.id}`} className="h-4 w-4" /><Label htmlFor={`or-${workflow.id}`} className="text-sm">Any (OR)</Label></div>
                </RadioGroup>
                OF THE FOLLOWING ARE MET:
            </h4>
            <div className="space-y-3">{workflow.conditions.map((cond) => <ConditionEditor key={cond.id} condition={cond} workflow={workflow} />)}</div>
            <Button variant="outline" size="sm" className="h-8 text-sm" onClick={handleAddCondition}><Plus className="mr-1 h-4 w-4"/> Add Condition</Button>
            <Separator />
            <h4 className="font-medium text-sm text-muted-foreground">THEN DO THESE ACTIONS:</h4>
            <div className="space-y-3">
                {workflow.actions.map((action, index) => <ActionEditor key={action.id || index} action={action} workflow={workflow} />)}
            </div>
            <Button variant="outline" size="sm" className="h-8 text-sm" onClick={handleAddAction}><Plus className="mr-1 h-4 w-4"/> Add Action</Button>
        </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Workflow Editor</DialogTitle>
          <DialogDescription>Define automated actions that run after a form is submitted.</DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex overflow-hidden">
            <aside className="w-1/3 border-r overflow-y-auto">
                <div className="p-4"><Button variant="outline" className="w-full" onClick={handleAddWorkflow}><Plus className="mr-2 h-4 w-4" /> Add New Workflow</Button></div>
                <div className="p-2 space-y-1">
                    {localWorkflows.map(workflow => (
                        <div key={workflow.id} className="relative group/workflow">
                            <button onClick={() => handleSelectWorkflow(workflow.id)} className={cn("w-full text-left p-2 rounded-md flex justify-between items-center", selectedWorkflowId === workflow.id ? 'bg-accent' : 'hover:bg-accent/50')}>
                                <span className="text-sm truncate">{workflow.name || "Untitled Workflow"}</span>
                            </button>
                                <Button variant="ghost" size="icon" className="absolute top-1/2 -translate-y-1/2 right-1 h-6 w-6 opacity-0 group-hover/workflow:opacity-100" onClick={(e) => {e.stopPropagation(); handleDeleteWorkflow(workflow.id)}}>
                                <Trash className="h-4 w-4 text-destructive" />
                                </Button>
                        </div>
                    ))}
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto">
                {selectedWorkflow ? ( <WorkflowEditor workflow={selectedWorkflow} />) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                        <Zap className="h-12 w-12 mb-4" />
                        <h3 className="text-lg font-semibold">No Workflow Selected</h3>
                        <p className="text-sm">Select a workflow from the left panel, or add a new one.</p>
                    </div>
                )}
            </main>
        </div>
        
        <DialogFooter className="p-4 border-t">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
