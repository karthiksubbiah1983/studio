

"use client";

import { useMemo, useState, useEffect, memo, useCallback, useRef } from "react";
import { useBuilder } from "@/hooks/use-builder";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { FormElementInstance, Rule, Section, Condition, RuleBehaviorType, ElementType, ListItemElement, RuleBehavior, ConditionSourceType, ConditionComparisonType, TaskStatus, Configuration } from "@/lib/types";
import { Plus, Trash, X, Settings2, GitCommitHorizontal, Copy } from "lucide-react";
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

const ConditionEditor = memo(({ 
    condition: initialCondition,
    onUpdateCondition,
    onDeleteCondition,
    selectableFields, 
    localConfigs,
}: { 
    condition: Condition, 
    onUpdateCondition: (id: string, updatedCondition: Condition) => void,
    onDeleteCondition: (id: string) => void,
    selectableFields: (FormElementInstance | Section)[],
    localConfigs: Configuration[],
}) => {
    const [condition, setCondition] = useState(initialCondition);
    
    useEffect(() => {
        setCondition(initialCondition);
    }, [initialCondition]);

    const handleUpdate = (field: keyof Condition, value: any) => {
        const newCondition = { ...condition, [field]: value };
        setCondition(newCondition);
        onUpdateCondition(condition.id, newCondition);
    }
    
    const handleComplexSelectChange = (updates: Partial<Condition>) => {
        const newCondition = { ...condition, ...updates };
        setCondition(newCondition);
        onUpdateCondition(condition.id, newCondition);
    }

    const sourceElement = useMemo(() => {
        if (condition.sourceType === 'field' && condition.sourceElementId) {
            return selectableFields.find(el => el.id === condition.sourceElementId) || null;
        }
        return null;
    }, [condition.sourceType, condition.sourceElementId, selectableFields]);

    const comparisonElement = useMemo(() => {
        if (condition.comparisonType === 'field' && condition.comparisonElementId) {
            return selectableFields.find(el => el.id === condition.comparisonElementId) || null;
        }
        return null;
    }, [condition.comparisonType, condition.comparisonElementId, selectableFields]);


    const handleDeleteCondition = () => {
        onDeleteCondition(condition.id);
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
                        <Select value={condition.sourceElementId} onValueChange={(value) => handleUpdate('sourceElementId', value)}>
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
                        <Select value={condition.sourceValue} onValueChange={(value) => handleUpdate('sourceValue', value)}>
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
                        <Select value={condition.sourceValue} onValueChange={(value) => handleUpdate('sourceValue', value)}>
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
            onValueChange: (value: ConditionComparisonType) => handleComplexSelectChange({ comparisonType: value, value: '', comparisonElementId: undefined })
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
                        <Select value={condition.value} onValueChange={(value) => handleUpdate('value', value)}>
                            <SelectTrigger><SelectValue placeholder="Select an option..." /></SelectTrigger>
                            <SelectContent>{sourceFieldOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                        </Select>
                    )
                 } else {
                    comparisonValueInput = <Input 
                        placeholder="Value" 
                        defaultValue={condition.value} 
                        onBlur={(e) => handleUpdate('value', e.target.value)} 
                    />;
                 }
                break;
            case 'date':
                comparisonValueInput = (
                    <Select value={condition.value} onValueChange={(value) => handleUpdate('value', value)}>
                        <SelectTrigger><SelectValue placeholder="Select a date..." /></SelectTrigger>
                        <SelectContent>
                            {specialDateOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                );
                break;
            case 'field':
                comparisonValueInput = (
                     <Select value={condition.comparisonElementId} onValueChange={(value) => handleUpdate('comparisonElementId', value)}>
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
                    <Select value={condition.value} onValueChange={(value) => handleUpdate('value', value)}>
                        <SelectTrigger><SelectValue placeholder="Select a status..." /></SelectTrigger>
                        <SelectContent>
                            {allStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                        </SelectContent>
                    </Select>
                );
                break;
            case 'config':
                 comparisonValueInput = (
                    <Select value={condition.value} onValueChange={(value) => handleUpdate('value', value)}>
                        <SelectTrigger><SelectValue placeholder="Select a configuration..." /></SelectTrigger>
                        <SelectContent>
                            {localConfigs.map(c => <SelectItem key={c.id} value={c.key}>{c.key}</SelectItem>)}
                        </SelectContent>
                    </Select>
                );
                break;
            default:
                comparisonValueInput = <Input 
                    placeholder="Value" 
                    defaultValue={condition.value} 
                    onBlur={(e) => handleUpdate('value', e.target.value)}
                />;
        }
        return (
            <>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <Label>Operator *</Label>
                        <Select value={condition.operator} onValueChange={(value) => handleUpdate('operator', value as Condition['operator'])}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="equals">Equals</SelectItem>
                                <SelectItem value="not_equals">Not Equals</SelectItem>
                                <SelectItem value="is_greater_than">Is Greater Than</SelectItem>
                                <SelectItem value="is_less_than">Is Less Than</SelectItem>
                                <SelectItem value="is_greater_than_or_equal_to">Is Greater Than or Equal To</SelectItem>
                                <SelectItem value="is_less_than_or_equal_to">Is Less Than or Equal To</SelectItem>
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
                    <Select value={condition.sourceType} onValueChange={(value: ConditionSourceType) => handleComplexSelectChange({ sourceType: value, sourceElementId: undefined, sourceValue: '' })}>
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
                            defaultValue={condition.offsetDays || ''}
                            onBlur={(e) => handleUpdate('offsetDays', e.target.value ? parseInt(e.target.value, 10) : undefined)}
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
                            defaultValue={condition.offsetValue || ''}
                            onBlur={(e) => handleUpdate('offsetValue', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                            className="h-8 text-xs"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground pb-1">Offset is added to the source value.</p>
                </div>
            )}
        </div>
    )
});
ConditionEditor.displayName = 'ConditionEditor';

const BehaviorEditor = memo(({ 
    behavior: initialBehavior,
    onUpdateBehavior,
    onDeleteBehavior,
    selectableFields,
    selectableSections,
    localConfigs
}: { 
    behavior: RuleBehavior, 
    onUpdateBehavior: (id: string, updatedBehavior: RuleBehavior) => void,
    onDeleteBehavior: (id: string) => void,
    selectableFields: (FormElementInstance | Section)[],
    selectableSections: Section[],
    localConfigs: Configuration[],
}) => {
    const [behavior, setBehavior] = useState(initialBehavior);
    
    useEffect(() => {
        setBehavior(initialBehavior);
    }, [initialBehavior]);

    const handleUpdate = (field: keyof RuleBehavior, value: any) => {
        const newBehavior = {...behavior, [field]: value};
        setBehavior(newBehavior);
        onUpdateBehavior(behavior.id, newBehavior);
    }
    
    const handleComplexSelectChange = (updates: Partial<RuleBehavior>) => {
        const newBehavior = {...behavior, ...updates};
        setBehavior(newBehavior);
        onUpdateBehavior(behavior.id, newBehavior);
    }

    const handleDeleteBehavior = () => {
        onDeleteBehavior(behavior.id);
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
                    onValueChange={(value) => handleComplexSelectChange({ type: value as RuleBehaviorType, targetElementId: '' })}
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
                        <SelectItem value="set_configuration">Set Configuration</SelectItem>
                        <SelectItem value="show_as_popup">Show as Popup</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                {behavior.type !== 'set_configuration' ? (
                    <>
                        <Label>Target Field *</Label>
                        <Select
                            value={behavior.targetElementId}
                            onValueChange={(value) => handleUpdate('targetElementId', value)}
                        >
                            <SelectTrigger>
                                <SelectValue>{selectedTargetFieldLabel}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {behavior.type === 'show_as_popup' 
                                    ? selectableSections.filter(s => s.popupOnly).map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                                    ))
                                    : (behavior.type === 'set_value' ? valueSettingFields : selectableFields).map(el => (
                                        <SelectItem key={el.id} value={el.id}>{(el as any).label || (el as Section).title}</SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>
                    </>
                ) : (
                    <>
                         <Label>Target Configuration *</Label>
                        <Select
                            value={behavior.targetConfigurationKey}
                            onValueChange={(value) => handleUpdate('targetConfigurationKey', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select configuration key..."/>
                            </SelectTrigger>
                            <SelectContent>
                                {localConfigs.map(config => (
                                    <SelectItem key={config.id} value={config.key}>{config.key}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </>
                )}
            </div>

            {behavior.type === 'change_color' && (
                <div className="flex items-end gap-4">
                    <div className="flex-1 space-y-2">
                        <Label>Property</Label>
                        <Select 
                            value={behavior.targetProperty}
                            onValueChange={(value) => handleUpdate('targetProperty', value as 'color' | 'backgroundColor')}
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
                            onChange={(e) => handleUpdate('color', e.target.value)}
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
                        defaultValue={behavior.message}
                        onBlur={(e) => handleUpdate('message', e.target.value)}
                    />
                </div>
            )}

            {(behavior.type === 'set_value' || behavior.type === 'set_configuration') && (
                <div className="space-y-2">
                    <Label>Value to Set</Label>
                    <Input
                        placeholder="Enter the value to set"
                        defaultValue={behavior.value || ''}
                        onBlur={(e) => handleUpdate('value', e.target.value)}
                    />
                </div>
            )}
        </div>
    )
});
BehaviorEditor.displayName = 'BehaviorEditor';

const RuleEditor = memo(({ 
    initialRule,
    selectableFields,
    selectableSections,
    localConfigs,
    onUpdate
}: { 
    initialRule: Rule,
    selectableFields: (FormElementInstance | Section)[],
    selectableSections: Section[],
    localConfigs: Configuration[],
    onUpdate: (updatedRule: Rule) => void
}) => {
    const [rule, setRule] = useState(initialRule);

    useEffect(() => {
        setRule(initialRule);
    }, [initialRule]);

    const handleUpdate = (updatedRule: Rule) => {
        setRule(updatedRule);
        onUpdate(updatedRule);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleUpdate({ ...rule, name: e.target.value });
    };

    const handleUpdateLogicType = (logicType: 'and' | 'or') => {
        handleUpdate({ ...rule, logicType });
    }
    
    const handleAddCondition = () => {
        const newCondition: Condition = {
            id: crypto.randomUUID(),
            sourceType: 'field',
            operator: 'equals',
            comparisonType: 'value',
            value: ""
        };
        handleUpdate({ ...rule, conditions: [...rule.conditions, newCondition] });
    };

    const handleUpdateCondition = (id: string, updatedCondition: Condition) => {
        const newConditions = rule.conditions.map(c => c.id === id ? updatedCondition : c);
        handleUpdate({ ...rule, conditions: newConditions });
    };

    const handleDeleteCondition = (id: string) => {
        handleUpdate({ ...rule, conditions: rule.conditions.filter(c => c.id !== id) });
    };

    const handleAddBehavior = () => {
        const newBehavior: RuleBehavior = {
            id: crypto.randomUUID(),
            type: 'show',
            targetElementId: ""
        };
        handleUpdate({ ...rule, behaviors: [...rule.behaviors, newBehavior] });
    };

    const handleUpdateBehavior = (id: string, updatedBehavior: RuleBehavior) => {
        const newBehaviors = rule.behaviors.map(b => b.id === id ? updatedBehavior : b);
        handleUpdate({ ...rule, behaviors: newBehaviors });
    };

    const handleDeleteBehavior = (id: string) => {
        handleUpdate({ ...rule, behaviors: rule.behaviors.filter(b => b.id !== id) });
    };


    return (
      <ScrollArea className="h-full">
        <div className="space-y-6 p-6">
            <div>
                <Label>Rule Name</Label>
                <Input value={rule.name} onChange={handleNameChange} className="mt-1 bg-white" />
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
                        <ConditionEditor 
                            key={cond.id} 
                            condition={cond} 
                            onUpdateCondition={handleUpdateCondition}
                            onDeleteCondition={handleDeleteCondition}
                            selectableFields={selectableFields} 
                            localConfigs={localConfigs}
                        />
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
                        <BehaviorEditor 
                            key={behavior.id} 
                            behavior={behavior} 
                            onUpdateBehavior={handleUpdateBehavior}
                            onDeleteBehavior={handleDeleteBehavior}
                            selectableFields={selectableFields}
                            selectableSections={selectableSections}
                            localConfigs={localConfigs}
                        />
                    ))}
                </div>
            </div>
        </div>
      </ScrollArea>
    )
});
RuleEditor.displayName = "RuleEditor";

const ConfigurationsEditor = memo(({
    localConfigs,
    onAddConfig,
    onUpdateConfig,
    onDeleteConfig
}: {
    localConfigs: Configuration[],
    onAddConfig: () => void,
    onUpdateConfig: (id: string, updatedConfig: Partial<Configuration>) => void,
    onDeleteConfig: (id: string) => void
}) => {
    
    const handleUpdate = (id: string, field: 'key' | 'value', value: string) => {
        onUpdateConfig(id, { [field]: value });
    };

    return (
      <div className="h-full flex flex-col bg-white">
        <div className="p-4 border-b flex justify-between items-center shrink-0">
          <h3 className="font-semibold">All Configurations</h3>
          <Button variant="outline" size="sm" onClick={onAddConfig}>
            <Plus className="mr-2 h-4 w-4" /> Add Configuration
          </Button>
        </div>
        <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {localConfigs.map(config => (
                <div key={config.id} className="flex items-center gap-2">
                  <Input
                    placeholder="Key"
                    defaultValue={config.key}
                    onBlur={(e) => handleUpdate(config.id, 'key', e.target.value.replace(/\s+/g, '_').toLowerCase())}
                  />
                  <Input
                    placeholder="Value"
                    defaultValue={config.value}
                    onBlur={(e) => handleUpdate(config.id, 'value', e.target.value)}
                  />
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => onDeleteConfig(config.id)}>
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
});
ConfigurationsEditor.displayName = 'ConfigurationsEditor';


export function RulesDialog({ isOpen, onOpenChange }: Props) {
  const { sections, rules, configurations, updateRules } = useBuilder();
  const [localRules, setLocalRules] = useState<Rule[]>([]);
  const [activeRule, setActiveRule] = useState<Rule | null>(null);
  const [localConfigs, setLocalConfigs] = useState<Configuration[]>([]);

  const activeRuleId = activeRule?.id;

  // Ref to store the latest version of the currently edited rule
  const dirtyRuleRef = useRef<Rule | null>(null);

  useEffect(() => {
    if (isOpen) {
        const initialRules = JSON.parse(JSON.stringify(rules || []));
        setLocalRules(initialRules);
        
        const initialConfigs = JSON.parse(JSON.stringify(configurations || []));
        setLocalConfigs(initialConfigs);

        if (initialRules.length > 0) {
            setActiveRule(initialRules[0]);
        } else {
            setActiveRule(null);
        }
        dirtyRuleRef.current = null; // Reset dirty rule on open
    }
  }, [isOpen, rules, configurations]);

  const selectableFields = useMemo(() => {
    return getAllElements(sections);
  }, [sections]);
  
  const handleSaveChanges = () => {
    let finalRules = localRules;
    // If there's a dirty rule being edited, update it in the list before saving.
    if (dirtyRuleRef.current && activeRuleId) {
        finalRules = localRules.map(r => r.id === activeRuleId ? dirtyRuleRef.current! : r);
    }
    updateRules(finalRules, localConfigs);
    onOpenChange(false);
  }

  const handleSelectRule = (ruleId: string) => {
    if (activeRuleId === ruleId) return;

    // Save the changes from the currently edited rule before switching
    if (dirtyRuleRef.current && activeRuleId) {
        setLocalRules(prev => prev.map(r => r.id === activeRuleId ? dirtyRuleRef.current! : r));
    }

    const nextRule = localRules.find(r => r.id === ruleId) || null;
    setActiveRule(nextRule);
    dirtyRuleRef.current = nextRule; // Set the new dirty rule
  }

  const handleAddRule = () => {
     // Save any pending changes from the current rule first
    if (dirtyRuleRef.current && activeRuleId) {
        setLocalRules(prev => prev.map(r => r.id === activeRuleId ? dirtyRuleRef.current! : r));
    }

    const newRule: Rule = {
      id: crypto.randomUUID(),
      name: `Rule ${localRules.length + 1}`,
      conditions: [{ id: crypto.randomUUID(), sourceType: 'field', operator: 'equals', comparisonType: 'value', value: "" }],
      logicType: 'and',
      behaviors: [{ id: crypto.randomUUID(), type: 'show', targetElementId: "" }]
    };
    
    setLocalRules(prev => [...prev, newRule]);
    setActiveRule(newRule);
    dirtyRuleRef.current = newRule;
  };

  const handleUpdateActiveRule = useCallback((updatedRule: Rule) => {
    // This function only updates the 'dirty' copy of the rule in the ref.
    // It does NOT trigger a state update on the entire dialog.
    dirtyRuleRef.current = updatedRule;
  }, []);

  const handleDeleteRule = (ruleId: string) => {
    setLocalRules(prev => {
        const newRules = prev.filter(r => r.id !== ruleId);
        if (activeRuleId === ruleId) {
            const newActiveRule = newRules.length > 0 ? newRules[0] : null;
            setActiveRule(newActiveRule);
            dirtyRuleRef.current = newActiveRule;
        }
        return newRules;
    });
  };

  const handleCopyRule = (ruleId: string) => {
    const ruleToCopy = localRules.find(r => r.id === ruleId);
    if (!ruleToCopy) return;

    const newRule = JSON.parse(JSON.stringify(ruleToCopy));
    newRule.id = crypto.randomUUID();
    newRule.name = `Copy of ${ruleToCopy.name}`;
    newRule.conditions.forEach((c: Condition) => c.id = crypto.randomUUID());
    newRule.behaviors.forEach((b: RuleBehavior) => b.id = crypto.randomUUID());
    
    setLocalRules(prev => {
        const ruleIndex = prev.findIndex(r => r.id === ruleId);
        const newRules = [...prev];
        newRules.splice(ruleIndex + 1, 0, newRule);
        return newRules;
    });
    // Immediately switch to the new copied rule
    setActiveRule(newRule);
    dirtyRuleRef.current = newRule;
  }
  
  const handleAddConfig = () => {
    const newConfig: Configuration = {
        id: crypto.randomUUID(),
        key: `config_${localConfigs.length + 1}`,
        value: ''
    };
    setLocalConfigs([...localConfigs, newConfig]);
  }
  
  const handleUpdateConfig = (id: string, updatedConfig: Partial<Configuration>) => {
      setLocalConfigs(localConfigs.map(c => c.id === id ? { ...c, ...updatedConfig } : c));
  }

  const handleDeleteConfig = (id: string) => {
      setLocalConfigs(localConfigs.filter(c => c.id !== id));
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
                             <button onClick={() => handleSelectRule(rule.id)} className={cn("w-full text-left px-3 py-2 truncate text-sm rounded-md", activeRuleId === rule.id ? 'bg-blue-50 font-semibold text-primary' : 'hover:bg-accent/50')}>
                                {(rule.name)}
                            </button>
                            <div className="absolute top-1/2 -translate-y-1/2 right-1 h-6 w-12 flex opacity-0 group-hover/rule:opacity-100">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {e.stopPropagation(); handleCopyRule(rule.id)}}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {e.stopPropagation(); handleDeleteRule(rule.id)}}
                                >
                                    <Trash className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
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
            {activeRule ? (
                <RuleEditor 
                    initialRule={activeRule} 
                    selectableFields={selectableFields} 
                    selectableSections={sections}
                    localConfigs={localConfigs}
                    onUpdate={handleUpdateActiveRule}
                />
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
                    <ConfigurationsEditor 
                        localConfigs={localConfigs}
                        onAddConfig={handleAddConfig}
                        onUpdateConfig={handleUpdateConfig}
                        onDeleteConfig={handleDeleteConfig}
                    />
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
