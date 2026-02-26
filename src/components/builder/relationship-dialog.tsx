
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { ArrowRight, Infinity } from 'lucide-react';
import { LocalDataset, DatasetRelationship, DatasetRelationshipType } from '@/lib/types';
import { cn } from '@/lib/utils';

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (relationship: DatasetRelationship) => void;
  datasets: LocalDataset[];
  relationship: DatasetRelationship | null;
};

export function RelationshipDialog({ isOpen, onOpenChange, onSave, datasets, relationship: initialRelationship }: Props) {
  const [name, setName] = useState('');
  const [sourceDatasetId, setSourceDatasetId] = useState('');
  const [targetDatasetId, setTargetDatasetId] = useState('');
  const [type, setType] = useState<DatasetRelationshipType>('one-to-one');
  const [sourceFieldKey, setSourceFieldKey] = useState('');
  const [targetFieldKey, setTargetFieldKey] = useState('');

  useEffect(() => {
    if (initialRelationship) {
      setName(initialRelationship.name);
      setSourceDatasetId(initialRelationship.sourceDatasetId);
      setTargetDatasetId(initialRelationship.targetDatasetId);
      setType(initialRelationship.type);
      setSourceFieldKey(initialRelationship.sourceFieldKey);
      setTargetFieldKey(initialRelationship.targetFieldKey);
    } else {
      setName(`Relationship ${Date.now().toString().slice(-4)}`);
      setSourceDatasetId('');
      setTargetDatasetId('');
      setType('one-to-one');
      setSourceFieldKey('');
      setTargetFieldKey('');
    }
  }, [initialRelationship]);

  const sourceDataset = useMemo(() => datasets.find(d => d.id === sourceDatasetId), [sourceDatasetId, datasets]);
  const targetDataset = useMemo(() => datasets.find(d => d.id === targetDatasetId), [targetDatasetId, datasets]);

  const getCompatibleFields = (dataset: LocalDataset | undefined, requiredType: 'text' | 'array') => {
    if (!dataset) return [];
    return dataset.columns.filter(c => (c.type || 'text') === requiredType);
  };

  const { sourceFields, targetFields, isMappingValid } = useMemo(() => {
    let sourceFields, targetFields;
    let isValid = false;
    switch (type) {
      case 'one-to-one':
        sourceFields = getCompatibleFields(sourceDataset, 'text');
        targetFields = getCompatibleFields(targetDataset, 'text');
        isValid = sourceFields.some(f => f.key === sourceFieldKey) && targetFields.some(f => f.key === targetFieldKey);
        break;
      case 'one-to-many':
        sourceFields = getCompatibleFields(sourceDataset, 'text');
        targetFields = getCompatibleFields(targetDataset, 'array');
        isValid = sourceFields.some(f => f.key === sourceFieldKey) && targetFields.some(f => f.key === targetFieldKey);
        break;
      case 'many-to-one':
        sourceFields = getCompatibleFields(sourceDataset, 'array');
        targetFields = getCompatibleFields(targetDataset, 'text');
        isValid = sourceFields.some(f => f.key === sourceFieldKey) && targetFields.some(f => f.key === targetFieldKey);
        break;
      case 'many-to-many':
        sourceFields = getCompatibleFields(sourceDataset, 'array');
        targetFields = getCompatibleFields(targetDataset, 'array');
        isValid = sourceFields.some(f => f.key === sourceFieldKey) && targetFields.some(f => f.key === targetFieldKey);
        break;
    }
    return { sourceFields, targetFields, isMappingValid: isValid };
  }, [type, sourceDataset, targetDataset, sourceFieldKey, targetFieldKey]);
  
  useEffect(() => {
    if (!sourceFields.some(f => f.key === sourceFieldKey)) setSourceFieldKey('');
  }, [sourceFields, sourceFieldKey]);

  useEffect(() => {
    if (!targetFields.some(f => f.key === targetFieldKey)) setTargetFieldKey('');
  }, [targetFields, targetFieldKey]);


  const handleSave = () => {
    if (!name || !sourceDatasetId || !targetDatasetId || !sourceFieldKey || !targetFieldKey) {
        alert("Please fill all fields");
        return;
    }
    onSave({
      id: initialRelationship?.id || crypto.randomUUID(),
      name,
      sourceDatasetId,
      targetDatasetId,
      type,
      sourceFieldKey,
      targetFieldKey,
    });
  };

  const relationshipTypes: { type: DatasetRelationshipType; source: string; target: string; label: string }[] = [
    { type: 'one-to-one', source: '1', target: '1', label: 'One-to-One' },
    { type: 'one-to-many', source: '1', target: 'Many', label: 'One-to-Many' },
    { type: 'many-to-one', source: 'Many', target: '1', label: 'Many-to-One' },
    { type: 'many-to-many', source: 'Many', target: 'Many', label: 'Many-to-Many' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{initialRelationship ? 'Edit' : 'Create'} Dataset Relationship</DialogTitle>
          <DialogDescription>Define how your datasets are linked together.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="rel-name">Relationship Name</Label>
            <Input id="rel-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., User to Posts" />
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <Label className="font-semibold">Source</Label>
                <Select value={sourceDatasetId} onValueChange={setSourceDatasetId}>
                  <SelectTrigger><SelectValue placeholder="Select source dataset..." /></SelectTrigger>
                  <SelectContent>
                    {datasets.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <div className="pt-12"><ArrowRight className="h-6 w-6 text-muted-foreground" /></div>
            <Card>
              <CardContent className="p-4 space-y-4">
                <Label className="font-semibold">Target</Label>
                <Select value={targetDatasetId} onValueChange={setTargetDatasetId}>
                  <SelectTrigger><SelectValue placeholder="Select target dataset..." /></SelectTrigger>
                  <SelectContent>
                    {datasets.map(d => <SelectItem key={d.id} value={d.id} disabled={d.id === sourceDatasetId}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <Label className="font-semibold">Relationship Type</Label>
            <div className="grid grid-cols-4 gap-2">
              {relationshipTypes.map(rt => (
                <button
                  key={rt.type}
                  onClick={() => setType(rt.type)}
                  className={cn(
                    "p-3 border rounded-md text-center cursor-pointer transition-colors",
                    type === rt.type ? "bg-primary/10 border-primary text-primary" : "hover:bg-accent"
                  )}
                >
                  <div className="flex items-center justify-center gap-2 font-bold text-lg">
                    {rt.source === 'Many' ? <Infinity className="h-5 w-5" /> : rt.source}
                    <ArrowRight className="h-4 w-4" />
                    {rt.target === 'Many' ? <Infinity className="h-5 w-5" /> : rt.target}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{rt.label}</p>
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
             <div className="space-y-2">
                <Label>Source Field Key</Label>
                <Select value={sourceFieldKey} onValueChange={setSourceFieldKey} disabled={!sourceDataset}>
                    <SelectTrigger><SelectValue placeholder="Select source key..." /></SelectTrigger>
                    <SelectContent>
                        {sourceFields?.map(f => <SelectItem key={f.key} value={f.key}>{f.header} <Badge variant="outline" className="ml-2">{f.type || 'text'}</Badge></SelectItem>)}
                    </SelectContent>
                </Select>
             </div>
             <div className="pb-2"><GitCommitHorizontal className="h-5 w-5 text-muted-foreground"/></div>
              <div className="space-y-2">
                <Label>Target Field Key</Label>
                <Select value={targetFieldKey} onValueChange={setTargetFieldKey} disabled={!targetDataset}>
                    <SelectTrigger><SelectValue placeholder="Select target key..." /></SelectTrigger>
                    <SelectContent>
                        {targetFields?.map(f => <SelectItem key={f.key} value={f.key}>{f.header} <Badge variant="outline" className="ml-2">{f.type || 'text'}</Badge></SelectItem>)}
                    </SelectContent>
                </Select>
             </div>
          </div>
          {!isMappingValid && sourceFieldKey && targetFieldKey && (
             <p className="text-sm text-destructive text-center">The selected fields are not compatible with the chosen relationship type.</p>
          )}

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!isMappingValid}>Save Relationship</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
