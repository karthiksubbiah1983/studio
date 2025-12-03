

"use client";

import { useMemo, useState, useEffect } from "react";
import { useBuilder } from "@/hooks/use-builder";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { FormElementInstance, Rule, Section, Condition, RuleBehaviorType, RuleBehavior, ConditionSourceType, ConditionComparisonType, TaskStatus } from "@/lib/types";
import { Plus, Trash, X, Settings2, GitCommitHorizontal } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { cn, findElementRecursive, getAllElements, getNestedValue } from "@/lib/utils";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const taskStatuses: TaskStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed', 'Escalated'];
const specialDateOptions = [
    { value: '_current_date', label: 'Current Date' },
    { value: '_due_date', label: 'Due Date' },
    { value: '_scheduled_date', label: 'Scheduled Date' },
];
const allStatuses: string[] = [...taskStatuses, 'Current Status'];


export function RulesDialog({ isOpen, onOpenChange }: Props) {
  const { sections, rules, updateRules } = useBuilder();
  const [localRules, setLocalRules] = useState<Rule[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
        const initialRules = JSON.parse(JSON.stringify(rules || []));
        setLocalRules(initialRules);
        if (initialRules.length > 0 && !selectedRuleId) {
            setSelectedRuleId(initialRules[0].id);
        } else if (initialRules.length > 0 && selectedRuleId) {
            const stillExists = initialRules.some((r: Rule) => r.id === selectedRuleId);
            if (!stillExists) {
                setSelectedRuleId(initialRules[0].id);
            }
        } else {
            setSelectedRuleId(null);
        }
    }
  }, [isOpen, rules]);

  useEffect(() => {
    if (isOpen) {
        const stillExists = localRules.some((r: Rule) => r.id === selectedRuleId);
        
        if (localRules.length > 0 && !stillExists) {
            setSelectedRuleId(localRules[0].id);
        } else if (localRules.length === 0) {
            setSelectedRuleId(null);
        }
    }
  }, [isOpen, localRules, selectedRuleId]);

  const allElementsAndSections = useMemo(() => getAllElements(sections), [sections]);
  const selectableFields = useMemo(() => {
    return allElementsAndSections.filter(el => {
        if ('type' in el) { // It's a FormElementInstance
            return el.required || el.exposeForValidation;
        }
        // It's a Section
        return el.exposeForValidation;
    });
  }, [allElementsAndSections]);
  
  const selectedRule = localRules.find(r => r.id === selectedRuleId);

  const handleAddRule = () => {
    const newRule: Rule = {
      id: crypto.randomUUID(),
      name: `Rule ${localRules.length + 1}`,
      conditions: [{
        id: crypto.randomUUID(),
        sourceType: 'field',
        operator: 'equals',
        comparisonType: 'value',
        value: ""
      }],
      logicType: 'and',
      behaviors: [{
        id: crypto.randomUUID(),
        type: 'show',
        targetElementId: ""
      }]
    };
    const newRules = [...localRules, newRule];
    setLocalRules(newRules);
    setSelectedRuleId(newRule.id);
  };

  const handleSelectRule = (ruleId: string) => {
    setSelectedRuleId(ruleId);
  }

  const handleUpdateRule = (updatedRule: Rule) => {
    const newRules = localRules.map(r => r.id === updatedRule.id ? updatedRule : r);
    setLocalRules(newRules);
  };

  const handleDeleteRule = (ruleId: string) => {
    const newRules = localRules.filter(r => r.id !== ruleId);
    setLocalRules(newRules);
    if (selectedRuleId === ruleId) {
      setSelectedRuleId(newRules.length > 0 ? newRules[0].id : null);
    }
  };

  const handleSaveChanges = () => {
    updateRules(localRules);
    onOpenChange(false);
  }

  const ConditionEditor = ({ condition, rule }: { condition: Condition, rule: Rule }) => {
    const sourceElement = useMemo(() => {
        if (condition.sourceType === 'field' && condition.sourceElementId) {
            return selectableFields.find(el => el.id === condition.sourceElementId) || null;
        }
        return null;
    }, [condition.sourceType, condition.sourceElementId]);

    const comparisonElement = useMemo(() => {
        if (condition.comparisonType === 'field' && condition.comparisonElementId) {
            return selectableFields.find(el => el.id === condition.comparisonElementId) || null;
        }
        return null;
    }, [condition.comparisonType, condition.comparisonElementId]);


    const handleUpdateCondition = (updatedCondition: Partial<Condition>) => {
        const newConditions = rule.conditions.map(c => c.id === condition.id ? { ...c, ...updatedCondition } : c);
        handleUpdateRule({ ...rule, conditions: newConditions });
    }

    const handleDeleteCondition = () => {
        const updatedRule = {
            ...rule,
            conditions: rule.conditions.filter(c => c.id !== condition.id)
        };
        handleUpdateRule(updatedRule);
    }
    
    const getFieldOptions = (element: FormElementInstance | Section | null): string[] => {
        if (!element || !('type' in element)) return [];
        if (element.type === 'Select' || element.type === 'RadioGroup') return element.options || [];
        if (element.type === 'Checkbox') return ['true', 'false'];
        return [];
    }
    
    const isDateRelated = (element: FormElementInstance | Section | null) => {
        if (!element) return false;
        if ('type' in element) return element.type === 'DatePicker';
        return false;
    }

    const shouldShowDateOffset = 
        (condition.sourceType === 'date' || isDateRelated(sourceElement)) || 
        (condition.comparisonType === 'date' || isDateRelated(comparisonElement));
    
    const renderSourceInput = () => {
        switch(condition.sourceType) {
            case 'field':
                return (
                    <Select value={condition.sourceElementId} onValueChange={(value) => handleUpdateCondition({ sourceElementId: value })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select a source field..." /></SelectTrigger>
                        <SelectContent>
                             {selectableFields.map(el => (
                                <SelectItem key={el.id} value={el.id}>{(el as FormElementInstance).label || (el as Section).title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case 'date':
                 return (
                    <Select value={condition.sourceValue} onValueChange={(value) => handleUpdateCondition({ sourceValue: value })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select a date..." /></SelectTrigger>
                        <SelectContent>
                            {specialDateOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                );
            case 'status':
                return (
                    <div className="h-8 text-xs px-3 py-2 text-muted-foreground">Current Status</div>
                );
            default: return null;
        }
    }


    const renderComparisonInput = () => {
        switch (condition.comparisonType) {
            case 'value':
                const sourceFieldOptions = getFieldOptions(sourceElement);
                 if (sourceFieldOptions.length > 0) {
                    return (
                        <Select value={condition.value} onValueChange={(value) => handleUpdateCondition({ value: value })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select an option..." /></SelectTrigger>
                            <SelectContent>{sourceFieldOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                        </Select>
                    )
                 }
                return <Input placeholder="Value" value={condition.value} onChange={(e) => handleUpdateCondition({ value: e.target.value })} className="h-8 text-xs" />;
            case 'date':
                return (
                    <Select value={condition.value} onValueChange={(value) => handleUpdateCondition({ value })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select a date..." /></SelectTrigger>
                        <SelectContent>
                            {specialDateOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                );
            case 'field':
                return (
                     <Select value={condition.comparisonElementId} onValueChange={(value) => handleUpdateCondition({ comparisonElementId: value })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select a field..." /></SelectTrigger>
                        <SelectContent>
                            {selectableFields.map(el => 'key' in el && el.key ? 
                                <SelectItem key={el.id} value={el.id}>{(el as FormElementInstance).label}</SelectItem> :
                                null
                            )}
                        </SelectContent>
                    </Select>
                );
            case 'status':
                 return (
                    <Select value={condition.value} onValueChange={(value) => handleUpdateCondition({ value })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select a status..." /></SelectTrigger>
                        <SelectContent>
                            {allStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                        </SelectContent>
                    </Select>
                );
            default:
                return <Input placeholder="Value" value={condition.value} onChange={(e) => handleUpdateCondition({ value: e.target.value })} className="h-8 text-xs" />;
        }
    }


    return (
        <div className="border bg-background/50 p-3 rounded-md space-y-3 relative">
            {rule.conditions.length > 1 && (
            <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-5 w-5" onClick={handleDeleteCondition}>
                <X className="h-3 w-3 text-destructive/70" />
            </Button>
            )}
            <div className="space-y-1">
                <Label className="text-xs">Source Type</Label>
                <Select value={condition.sourceType} onValueChange={(value: ConditionSourceType) => handleUpdateCondition({ sourceType: value, sourceElementId: undefined, sourceValue: '' })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="field">Field</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="status">Current Status</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-1">
                {condition.sourceType !== 'status' && <Label className="text-xs">Source</Label>}
                {renderSourceInput()}
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
                    </div>
                    <Select 
                        value={condition.comparisonType} 
                        onValueChange={(value: ConditionComparisonType) => handleUpdateCondition({ comparisonType: value, value: '', comparisonElementId: undefined })}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select comparison type..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="value">Value</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="field">Field</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            <div className="space-y-1">
                {renderComparisonInput()}
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
  
  const BehaviorEditor = ({ behavior, rule }: { behavior: RuleBehavior, rule: Rule }) => {
    
    const handleUpdateBehavior = (updatedBehavior: Partial<RuleBehavior>) => {
      const newBehaviors = rule.behaviors.map(b => b.id === behavior.id ? { ...b, ...updatedBehavior } : b);
      handleUpdateRule({ ...rule, behaviors: newBehaviors });
    }

    const handleDeleteBehavior = () => {
        const newBehaviors = rule.behaviors.filter(b => b.id !== behavior.id);
        handleUpdateRule({ ...rule, behaviors: newBehaviors });
    }

    return (
        <div className="space-y-3 p-3 border rounded-lg bg-accent/20 relative">
            {rule.behaviors.length > 1 && (
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-5 w-5" onClick={handleDeleteBehavior}>
                    <X className="h-3 w-3 text-destructive/70" />
                </Button>
            )}
            <div className="space-y-2">
                <Label className="text-xs">Behavior</Label>
                <Select
                    value={behavior.type}
                    onValueChange={(value) => handleUpdateBehavior({ type: value as RuleBehaviorType })}
                >
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="show">Show</SelectItem>
                        <SelectItem value="hide">Hide</SelectItem>
                        <SelectItem value="enable">Enable</SelectItem>
                        <SelectItem value="disable">Disable</SelectItem>
                        <SelectItem value="change_color">Change Color</SelectItem>
                        <SelectItem value="set_error">Set Error</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label className="text-xs">Target Field</Label>
                <Select
                    value={behavior.targetElementId || ""}
                    onValueChange={(value) => handleUpdateBehavior({ targetElementId: value })}
                >
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select target field..." />
                    </SelectTrigger>
                    <SelectContent>
                        {allElementsAndSections.map(el => (
                            <SelectItem key={el.id} value={el.id}>{(el as FormElementInstance).label || (el as Section).title} ({'type' in el ? el.type : 'Section'})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {behavior.type === 'change_color' && (
                <div className="flex items-end gap-2">
                    <div className="flex-1">
                        <Label className="text-xs">Property</Label>
                        <Select 
                            value={behavior.targetProperty}
                            onValueChange={(value) => handleUpdateBehavior({ targetProperty: value as 'color' | 'backgroundColor' })}
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Target" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="color">Text Color</SelectItem>
                                <SelectItem value="backgroundColor">Background Color</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1">
                        <Label className="text-xs">Color</Label>
                        <Input
                            type="color"
                            value={behavior.color || '#000000'}
                            onChange={(e) => handleUpdateBehavior({ color: e.target.value })}
                            className="p-1 h-8"
                        />
                    </div>
                </div>
            )}

            {behavior.type === 'set_error' && (
                <div className="space-y-2">
                        <Label className="text-xs">Error Message</Label>
                        <Input
                        placeholder="e.g. Value must be greater than 10"
                        value={behavior.message}
                        onChange={(e) => handleUpdateBehavior({ message: e.target.value })}
                        className="h-8 text-xs"
                    />
                </div>
            )}
        </div>
    )
  }

  const RuleEditor = ({ rule }: { rule: Rule }) => {
    
    const handleUpdateRuleName = (name: string) => {
        handleUpdateRule({ ...rule, name });
    }

    const handleUpdateLogicType = (logicType: 'and' | 'or') => {
        handleUpdateRule({ ...rule, logicType });
    }
    
    const handleAddCondition = () => {
        const newCondition: Condition = {
            id: crypto.randomUUID(),
            sourceType: 'field',
            operator: 'equals',
            comparisonType: 'value',
            value: ""
        };
        const updatedRule = { ...rule, conditions: [...rule.conditions, newCondition] };
        handleUpdateRule(updatedRule);
    };

    const handleAddBehavior = () => {
        const newBehavior: RuleBehavior = {
            id: crypto.randomUUID(),
            type: 'show',
            targetElementId: ""
        };
        const updatedRule = { ...rule, behaviors: [...rule.behaviors, newBehavior] };
        handleUpdateRule(updatedRule);
    }

    return (
        <div className="p-4 space-y-4">
            <Input 
                value={rule.name}
                onChange={(e) => handleUpdateRuleName(e.target.value)}
                className="text-lg font-medium"
            />
            <Separator />
            <h4 className="font-medium text-sm text-muted-foreground flex items-center">
                IF 
                <RadioGroup
                    value={rule.logicType}
                    onValueChange={(value) => handleUpdateLogicType(value as 'and' | 'or')}
                    className="flex ml-2"
                >
                    <div className="flex items-center space-x-1">
                        <RadioGroupItem value="and" id={`and-${rule.id}`} className="h-4 w-4" />
                        <Label htmlFor={`and-${rule.id}`} className="text-sm">All (AND)</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                        <RadioGroupItem value="or" id={`or-${rule.id}`} className="h-4 w-4" />
                        <Label htmlFor={`or-${rule.id}`} className="text-sm">Any (OR)</Label>
                    </div>
                </RadioGroup>
                OF THE FOLLOWING ARE MET:
            </h4>
            <div className="space-y-3">
                 {rule.conditions.map((cond) => (
                    <ConditionEditor key={cond.id} condition={cond} rule={rule} />
                ))}
            </div>
             <Button variant="outline" size="sm" className="h-8 text-sm" onClick={handleAddCondition}>
                <Plus className="mr-1 h-4 w-4"/> Add Condition
            </Button>
            <Separator />
            <h4 className="font-medium text-sm text-muted-foreground">THEN DO THIS:</h4>
            <div className="space-y-3">
                {rule.behaviors.map((behavior) => (
                    <BehaviorEditor key={behavior.id} behavior={behavior} rule={rule} />
                ))}
            </div>
            <Button variant="outline" size="sm" className="h-8 text-sm" onClick={handleAddBehavior}>
                <Plus className="mr-1 h-4 w-4"/> Add Behavior
            </Button>
        </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Rule Editor</DialogTitle>
          <DialogDescription>
            Create and manage rules to add conditional logic to your form.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 flex overflow-hidden">
            <aside className="w-1/3 border-r overflow-y-auto">
                <div className="p-4">
                     <Button variant="outline" className="w-full" onClick={handleAddRule}>
                        <Plus className="mr-2 h-4 w-4" /> Add New Rule
                    </Button>
                </div>
                <div className="p-2 space-y-1">
                    {localRules.map(rule => (
                        <div key={rule.id} className="relative group/rule">
                            <button
                                onClick={() => handleSelectRule(rule.id)}
                                className={cn(
                                    "w-full text-left p-2 rounded-md flex justify-between items-center",
                                    selectedRuleId === rule.id ? 'bg-accent' : 'hover:bg-accent/50'
                                )}
                            >
                                <span className="text-sm truncate">{rule.name || "Untitled Rule"}</span>
                            </button>
                             <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-1/2 -translate-y-1/2 right-1 h-6 w-6 opacity-0 group-hover/rule:opacity-100"
                                onClick={(e) => {e.stopPropagation(); handleDeleteRule(rule.id)}}
                             >
                                <Trash className="h-4 w-4 text-destructive" />
                             </Button>
                        </div>
                    ))}
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto">
                {selectedRule ? (
                   <RuleEditor rule={selectedRule} />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                        <Settings2 className="h-12 w-12 mb-4" />
                        <h3 className="text-lg font-semibold">No Rule Selected</h3>
                        <p className="text-sm">Select a rule from the left panel to edit it, or add a new rule.</p>
                    </div>
                )}
            </main>
        </div>
        <DialogFooter className="p-4 border-t">
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    
