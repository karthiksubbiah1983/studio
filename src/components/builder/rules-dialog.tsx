

"use client";

import { useMemo, useState, useEffect } from "react";
import { useBuilder } from "@/hooks/use-builder";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { FormElementInstance, Rule, Section, Condition, RuleBehaviorType, ElementType, DataGridColumn, TableColumn, ListItemElement, RuleBehavior, ConditionSourceType, ConditionComparisonType, TaskStatus, Configuration } from "@/lib/types";
import { Plus, Trash, X, Settings2, GitCommitHorizontal } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { cn, getAllElements } from "@/lib/utils";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

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
  const { sections, rules, configurations, updateRules, updateConfigurations } = useBuilder();
  const [localRules, setLocalRules] = useState<Rule[]>([]);
  const [localConfigs, setLocalConfigs] = useState<Configuration[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
        const initialRules = JSON.parse(JSON.stringify(rules || []));
        setLocalRules(initialRules);
        
        const initialConfigs = JSON.parse(JSON.stringify(configurations || []));
        setLocalConfigs(initialConfigs);

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
  }, [isOpen, rules, configurations]);

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

  const selectableFields = useMemo(() => {
    return getAllElements(sections);
  }, [sections]);
  
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
    updateRules(localRules, localConfigs);
    onOpenChange(false);
  }
  
  const handleAddConfig = () => {
    const newConfig: Configuration = {
        id: crypto.randomUUID(),
        key: `config_${localConfigs.length + 1}`,
        value: ''
    };
    setLocalConfigs([...localConfigs, newConfig]);
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

     const isNumericRelated = (element: FormElementInstance | Section | null) => {
        if (!element) return false;
        if ('type' in element) return element.type === 'Input' && element.inputFormat === 'number';
        return false;
    };

    const showDateOffset = 
        (condition.sourceType === 'date' || isDateRelated(sourceElement)) || 
        (condition.comparisonType === 'date' || isDateRelated(comparisonElement));

    const showValueOffset = (isNumericRelated(sourceElement) || isNumericRelated(comparisonElement)) &&
        (condition.operator === 'is_greater_than' || condition.operator === 'is_less_than');
    
    const renderSourceInput = () => {
        switch(condition.sourceType) {
            case 'field':
                return (
                    <div className='flex flex-col gap-2'>
                        <Label>Source Field *</Label>
                        <Select value={condition.sourceElementId} onValueChange={(value) => handleUpdateCondition({ sourceElementId: value })}>
                            <SelectTrigger><SelectValue placeholder="Select a source field..." /></SelectTrigger>
                            <SelectContent>
                                {selectableFields.map(el => (
                                    <SelectItem key={el.id} value={el.id}>{(el as any).label || (el as Section).title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                );
            case 'date':
                 return (
                    <div className='flex flex-col gap-2'>
                        <Label>Source Value *</Label>
                        <Select value={condition.sourceValue} onValueChange={(value) => handleUpdateCondition({ sourceValue: value })}>
                            <SelectTrigger><SelectValue placeholder="Select a date..." /></SelectTrigger>
                            <SelectContent>
                                {specialDateOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                );
            case 'status':
                return (
                    <div className='flex flex-col gap-2'>
                        <Label>Source</Label>
                        <div className="h-10 px-3 py-2 text-muted-foreground border rounded-md bg-muted/50">Current Status</div>
                    </div>
                );
            case 'config':
                return (
                    <div className='flex flex-col gap-2'>
                        <Label>Source Value *</Label>
                        <Select value={condition.sourceValue} onValueChange={(value) => handleUpdateCondition({ sourceValue: value })}>
                            <SelectTrigger><SelectValue placeholder="Select a configuration..." /></SelectTrigger>
                            <SelectContent>
                                {localConfigs.map(c => <SelectItem key={c.id} value={c.key}>{c.key}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                );
            default: return null;
        }
    }

    const renderComparisonInput = () => {
        const commonProps = {
            value: condition.comparisonType,
            onValueChange: (value: ConditionComparisonType) => handleUpdateCondition({ comparisonType: value, value: '', comparisonElementId: undefined })
        };
        const commonTrigger = <SelectTrigger><SelectValue placeholder="Select comparison type..." /></SelectTrigger>;
        const commonContent = (
            <SelectContent>
                <SelectItem value="value">Value</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="field">Field</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="config">Configuration</SelectItem>
            </SelectContent>
        );

        let comparisonValueInput = null;
        switch (condition.comparisonType) {
            case 'value':
                const sourceFieldOptions = getFieldOptions(sourceElement);
                 if (sourceFieldOptions.length > 0) {
                    comparisonValueInput = (
                        <Select value={condition.value} onValueChange={(value) => handleUpdateCondition({ value: value })}>
                            <SelectTrigger><SelectValue placeholder="Select an option..." /></SelectTrigger>
                            <SelectContent>{sourceFieldOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                        </Select>
                    )
                 } else {
                    comparisonValueInput = <Input placeholder="Value" value={condition.value} onChange={(e) => handleUpdateCondition({ value: e.target.value })} />;
                 }
                break;
            case 'date':
                comparisonValueInput = (
                    <Select value={condition.value} onValueChange={(value) => handleUpdateCondition({ value })}>
                        <SelectTrigger><SelectValue placeholder="Select a date..." /></SelectTrigger>
                        <SelectContent>
                            {specialDateOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                );
                break;
            case 'field':
                comparisonValueInput = (
                     <Select value={condition.comparisonElementId} onValueChange={(value) => handleUpdateCondition({ comparisonElementId: value })}>
                        <SelectTrigger><SelectValue placeholder="Select a field..." /></SelectTrigger>
                        <SelectContent>
                            {selectableFields.map(el => (
                                <SelectItem key={el.id} value={el.id}>{(el as any).label || (el as Section).title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
                break;
            case 'status':
                 comparisonValueInput = (
                    <Select value={condition.value} onValueChange={(value) => handleUpdateCondition({ value })}>
                        <SelectTrigger><SelectValue placeholder="Select a status..." /></SelectTrigger>
                        <SelectContent>
                            {allStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                        </SelectContent>
                    </Select>
                );
                break;
            case 'config':
                 comparisonValueInput = (
                    <Select value={condition.value} onValueChange={(value) => handleUpdateCondition({ value: value })}>
                        <SelectTrigger><SelectValue placeholder="Select a configuration..." /></SelectTrigger>
                        <SelectContent>
                            {localConfigs.map(c => <SelectItem key={c.id} value={c.key}>{c.key}</SelectItem>)}
                        </SelectContent>
                    </Select>
                );
                break;
            default:
                comparisonValueInput = <Input placeholder="Value" value={condition.value} onChange={(e) => handleUpdateCondition({ value: e.target.value })} />;
        }
        return (
            <>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <Label>Operator *</Label>
                        <Select value={condition.operator} onValueChange={(value) => handleUpdateCondition({ operator: value as Condition['operator'] })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <div className="flex flex-col gap-2">
                        <Label>Compare To *</Label>
                        <Select {...commonProps}>
                            {commonTrigger}
                            {commonContent}
                        </Select>
                    </div>
                </div>
                {comparisonValueInput}
            </>
        );
    }

    return (
        <div className="border bg-white p-4 rounded-md space-y-4 relative">
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={handleDeleteCondition}>
                <X className="h-4 w-4 text-red-500" />
            </Button>
            <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-2">
                    <Label>Source Type *</Label>
                    <Select value={condition.sourceType} onValueChange={(value: ConditionSourceType) => handleUpdateCondition({ sourceType: value, sourceElementId: undefined, sourceValue: '' })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="field">Field</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="status">Current Status</SelectItem>
                            <SelectItem value="config">Configuration</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {renderSourceInput()}
                {renderComparisonInput()}
            </div>
             {showDateOffset && (
                <div className="flex items-end gap-2">
                    <div className="w-1/2 space-y-1">
                        <Label className="text-xs">Date Offset (days)</Label>
                        <Input
                            type="number"
                            placeholder="e.g., 2 or -2"
                            value={condition.offsetDays || ''}
                            onChange={(e) => handleUpdateCondition({ offsetDays: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                            className="h-8 text-xs"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground pb-1">Offset is added to the source date.</p>
                </div>
            )}
             {showValueOffset && (
                <div className="flex items-end gap-2">
                    <div className="w-1/2 space-y-1">
                        <Label className="text-xs">Value Offset</Label>
                        <Input
                            type="number"
                            placeholder="e.g., 5 or -10"
                            value={condition.offsetValue || ''}
                            onChange={(e) => handleUpdateCondition({ offsetValue: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                            className="h-8 text-xs"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground pb-1">Offset is added to the source value.</p>
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

    const valueSettingFields = useMemo(() => 
        selectableFields.filter(el => 'type' in el && (el.type === 'Input' || el.type === 'Display' || (el.id.includes("::"))))
    , [selectableFields]);

    const targetField = selectableFields.find(f => f.id === behavior.targetElementId);
    
    const selectedTargetFieldLabel = targetField ? `${(targetField as any).label || (targetField as Section).title}` : "Select target field...";


    return (
        <div className="space-y-4 p-4 border rounded-lg bg-white relative">
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={handleDeleteBehavior}>
                <X className="h-4 w-4 text-red-500" />
            </Button>
            <div className="space-y-2">
                <Label>Action *</Label>
                <Select
                    value={behavior.type}
                    onValueChange={(value) => handleUpdateBehavior({ type: value as RuleBehaviorType, targetElementId: '' })}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="show">Show</SelectItem>
                        <SelectItem value="hide">Hide</SelectItem>
                        <SelectItem value="enable">Enable</SelectItem>
                        <SelectItem value="disable">Disable</SelectItem>
                        <SelectItem value="change_color">Change Color</SelectItem>
                        <SelectItem value="set_error">Set Error</SelectItem>
                        <SelectItem value="set_value">Set Value</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label>Target Field *</Label>
                <Select
                    value={behavior.targetElementId}
                    onValueChange={(value) => handleUpdateBehavior({ targetElementId: value })}
                >
                    <SelectTrigger>
                        <SelectValue>{selectedTargetFieldLabel}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {(behavior.type === 'set_value' ? valueSettingFields : selectableFields).map(el => (
                            <SelectItem key={el.id} value={el.id}>{(el as any).label || (el as Section).title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {behavior.type === 'change_color' && (
                <div className="flex items-end gap-4">
                    <div className="flex-1 space-y-2">
                        <Label>Property</Label>
                        <Select 
                            value={behavior.targetProperty}
                            onValueChange={(value) => handleUpdateBehavior({ targetProperty: value as 'color' | 'backgroundColor' })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Target" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="color">Text Color</SelectItem>
                                <SelectItem value="backgroundColor">Background Color</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 space-y-2">
                        <Label>Color</Label>
                        <Input
                            type="color"
                            value={behavior.color || '#000000'}
                            onChange={(e) => handleUpdateBehavior({ color: e.target.value })}
                            className="p-1 h-10"
                        />
                    </div>
                </div>
            )}

            {behavior.type === 'set_error' && (
                <div className="space-y-2">
                        <Label>Error Message</Label>
                        <Input
                        placeholder="e.g. Value must be greater than 10"
                        value={behavior.message}
                        onChange={(e) => handleUpdateBehavior({ message: e.target.value })}
                    />
                </div>
            )}

            {behavior.type === 'set_value' && (
                <div className="space-y-2">
                    <Label>Value to Set</Label>
                    <Input
                        placeholder="Enter the value to set"
                        value={behavior.value || ''}
                        onChange={(e) => handleUpdateBehavior({ value: e.target.value })}
                    />
                </div>
            )}
        </div>
    )
  }

  const RuleEditor = ({ rule }: { rule: Rule }) => {

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
      <ScrollArea className="h-full">
        <div className="space-y-6 p-6">
            <div>
                <Label>Rule Name</Label>
                <Input value={rule.name} onChange={e => handleUpdateRule({ ...rule, name: e.target.value })} className="mt-1 bg-white" />
            </div>
            
            <div className="space-y-4">
                <div className="p-3 bg-primary/10 rounded-md flex justify-between items-center">
                    <h3 className="font-semibold text-primary">Set Conditions</h3>
                    <Button variant="outline" size="sm" onClick={handleAddCondition}>
                        <Plus className="mr-2 h-4 w-4" /> Condition
                    </Button>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium">Conditional Operator</span>
                    <RadioGroup
                        value={rule.logicType}
                        onValueChange={(value) => handleUpdateLogicType(value as 'and' | 'or')}
                        className="flex"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="and" id={`and-${rule.id}`} />
                            <Label htmlFor={`and-${rule.id}`} className="font-normal">AND</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="or" id={`or-${rule.id}`} />
                            <Label htmlFor={`or-${rule.id}`} className="font-normal">OR</Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="space-y-4">
                    {rule.conditions.map((cond) => (
                        <ConditionEditor key={cond.id} condition={cond} rule={rule} />
                    ))}
                </div>
            </div>
            
            <div className="space-y-4">
                 <div className="p-3 bg-primary/10 rounded-md flex justify-between items-center">
                    <h3 className="font-semibold text-primary">Set Behaviour</h3>
                    <Button variant="outline" size="sm" onClick={handleAddBehavior}>
                        <Plus className="mr-2 h-4 w-4" /> Action
                    </Button>
                </div>
                <div className="space-y-4">
                    {rule.behaviors.map((behavior) => (
                        <BehaviorEditor key={behavior.id} behavior={behavior} rule={rule} />
                    ))}
                </div>
            </div>
        </div>
      </ScrollArea>
    )
  }

  const ConfigurationsEditor = () => {
    
    const handleUpdateConfig = (id: string, updatedConfig: Partial<Configuration>) => {
        setLocalConfigs(localConfigs.map(c => c.id === id ? { ...c, ...updatedConfig } : c));
    }

    const handleDeleteConfig = (id: string) => {
        setLocalConfigs(localConfigs.filter(c => c.id !== id));
    }
    
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="p-4 border-b flex justify-between items-center shrink-0">
          <h3 className="font-semibold">All Configurations</h3>
          <Button variant="outline" size="sm" onClick={handleAddConfig}>
            <Plus className="mr-2 h-4 w-4" /> Add Configuration
          </Button>
        </div>
        <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {localConfigs.map(config => (
                <div key={config.id} className="flex items-center gap-2">
                  <Input
                    placeholder="Key"
                    value={config.key}
                    onChange={(e) => handleUpdateConfig(config.id, { key: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                  />
                  <Input
                    placeholder="Value"
                    value={config.value}
                    onChange={(e) => handleUpdateConfig(config.id, { value: e.target.value })}
                  />
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleDeleteConfig(config.id)}>
                    <Trash className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {localConfigs.length === 0 && (
                <div className="text-center text-sm text-muted-foreground pt-10">
                  No configurations created yet.
                </div>
              )}
            </div>
        </ScrollArea>
      </div>
    )
  }
  
  const RulesEditorLayout = () => (
    <div className="flex flex-row overflow-hidden h-full bg-slate-50">
        <aside className="w-1/3 border-r flex flex-col bg-white">
            <div className="p-4 border-b shrink-0 flex items-center justify-center">
                <Button variant="outline" className="w-full justify-center" onClick={handleAddRule}>
                    Add New Rule
                </Button>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                    {localRules.length > 0 ? localRules.map(rule => (
                        <div key={rule.id} className="relative group/rule">
                             <button onClick={() => handleSelectRule(rule.id)} className={cn("w-full text-left px-3 py-2 truncate text-sm rounded-md", selectedRuleId === rule.id ? 'bg-blue-50 font-semibold text-primary' : 'hover:bg-accent/50')}>
                                {rule.name}
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
                    )) : (
                        <div className="text-center text-sm text-muted-foreground pt-10">
                            No rules created yet.
                        </div>
                    )}
                </div>
            </ScrollArea>
        </aside>
        <main className="flex-1 flex flex-col min-h-0 bg-slate-50">
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
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b bg-slate-50">
          <DialogTitle>Rules &amp; Configurations</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden bg-white">
            <Tabs defaultValue="rules" className="h-full flex flex-col">
                <div className="px-4 border-b">
                    <TabsList className="grid w-full grid-cols-2 bg-transparent p-0">
                        <TabsTrigger value="configurations">Configurations</TabsTrigger>
                        <TabsTrigger value="rules">Rules</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="rules" className="flex-1 h-0 m-0">
                    <RulesEditorLayout />
                </TabsContent>
                <TabsContent value="configurations" className="flex-1 h-0 m-0">
                    <ConfigurationsEditor />
                </TabsContent>
            </Tabs>
        </div>
        <DialogFooter className="p-4 border-t bg-slate-50">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSaveChanges}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    

    