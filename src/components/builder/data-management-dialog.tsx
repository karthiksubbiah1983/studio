'use client';

import { useState, useEffect, memo, useMemo } from 'react';
import { useBuilder } from '@/hooks/use-builder';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Dataset, DatasetColumn } from '@/lib/types';
import { Plus, Trash, Copy, Edit, Table as TableIcon, X } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const TagInput = ({ value: initialValue, onChange }: { value?: string[], onChange: (value: string[]) => void }) => {
    const [inputValue, setInputValue] = useState('');
    const tags = Array.isArray(initialValue) ? initialValue : [];

    const handleAddTag = () => {
        const newTag = inputValue.trim();
        if (newTag && !tags.includes(newTag)) {
            onChange([...tags, newTag]);
        }
        setInputValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleAddTag();
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        onChange(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="flex flex-wrap items-center gap-2 p-1 border rounded-md min-h-[40px] bg-white">
            {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="group text-sm">
                    {tag}
                    <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1.5 rounded-full opacity-50 group-hover:opacity-100 transition-opacity"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            ))}
            <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleAddTag}
                placeholder="Add item..."
                className="flex-1 h-auto min-w-[80px] border-none shadow-none focus-visible:ring-0 p-1"
            />
        </div>
    );
};

const DatasetEditor = memo(({ dataset, onUpdate }: { dataset: Dataset, onUpdate: (updated: Dataset) => void }) => {
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; colKey: string; header: string; value: string } | null>(null);
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...dataset, name: e.target.value });
  };
  
  // Column Handlers
  const handleAddColumn = () => {
    const newColumn: DatasetColumn = {
        id: crypto.randomUUID(),
        header: `Column ${dataset.columns.length + 1}`,
        key: `column_${dataset.columns.length + 1}`.toLowerCase(),
        type: 'text',
    };
    onUpdate({ ...dataset, columns: [...dataset.columns, newColumn] });
  };
  
  const handleUpdateColumn = (colId: string, field: 'header' | 'key' | 'type', value: string) => {
    const newColumns = dataset.columns.map(c => {
        if (c.id === colId) {
            return { ...c, [field]: value };
        }
        return c;
    });
    onUpdate({ ...dataset, columns: newColumns });
  };

  const handleDeleteColumn = (colId: string) => {
    onUpdate({ ...dataset, columns: dataset.columns.filter(c => c.id !== colId) });
  };
  
  // Row Handlers
  const handleAddRow = () => {
    const newRow = dataset.columns.reduce((acc, col) => {
        acc[col.key] = col.type === 'array' ? [] : '';
        return acc;
    }, {} as Record<string, any>);
    onUpdate({ ...dataset, data: [...dataset.data, newRow] });
  };

  const handleUpdateCell = (rowIndex: number, colKey: string, value: any) => {
    const newData = [...dataset.data];
    newData[rowIndex] = { ...newData[rowIndex], [colKey]: value };
    onUpdate({ ...dataset, data: newData });
  };
  
  const handleDeleteRow = (rowIndex: number) => {
    const newData = dataset.data.filter((_, i) => i !== rowIndex);
    onUpdate({ ...dataset, data: newData });
  };

  const handleCopyRow = (rowIndex: number) => {
    const rowToCopy = dataset.data[rowIndex];
    if (!rowToCopy) return;

    // Deep copy the row
    const copiedRow = JSON.parse(JSON.stringify(rowToCopy));

    const newData = [...dataset.data];
    newData.splice(rowIndex + 1, 0, copiedRow);
    onUpdate({ ...dataset, data: newData });
  };

  const handleSaveModal = () => {
    if (editingCell) {
        handleUpdateCell(editingCell.rowIndex, editingCell.colKey, editingCell.value);
        setEditingCell(null);
    }
  };

  return (
    <div className="h-full relative">
      <ScrollArea className="h-full">
        <div className="space-y-6 p-6">
            <div>
                <Label>Dataset Name</Label>
                <Input id="dataset-name" value={dataset.name} onChange={handleNameChange} className="mt-1 bg-white font-medium text-lg" />
            </div>

            <div className="space-y-4">
                <div className="p-3 bg-primary/10 rounded-md flex justify-between items-center">
                    <h3 className="font-semibold text-primary">Columns</h3>
                    <Button variant="outline" size="sm" onClick={handleAddColumn}>
                        <Plus className="mr-2 h-4 w-4" /> Column
                    </Button>
                </div>
                <div className="border bg-white p-4 rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40%]">Header</TableHead>
                                <TableHead className="w-[40%]">Key</TableHead>
                                <TableHead className="w-[20%]">Type</TableHead>
                                <TableHead className="w-10"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dataset.columns.map(col => (
                                <TableRow key={col.id}>
                                    <TableCell className="py-1 px-2">
                                        <Input defaultValue={col.header} onBlur={(e) => handleUpdateColumn(col.id, 'header', e.target.value)} className="h-8"/>
                                    </TableCell>
                                    <TableCell className="py-1 px-2">
                                        <Input defaultValue={col.key} onBlur={(e) => handleUpdateColumn(col.id, 'key', e.target.value.replace(/\s+/g, '_').toLowerCase())} className="h-8"/>
                                    </TableCell>
                                    <TableCell className="py-1 px-2">
                                        <Select value={col.type || 'text'} onValueChange={(value) => handleUpdateColumn(col.id, 'type', value)}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="text">Text</SelectItem>
                                                <SelectItem value="array">List</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="py-1 px-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteColumn(col.id)}>
                                            <Trash className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
            
            <div className="space-y-4">
                <div className="p-3 bg-primary/10 rounded-md flex justify-between items-center">
                    <h3 className="font-semibold text-primary">Data Rows</h3>
                    <Button variant="outline" size="sm" onClick={handleAddRow}>
                        <Plus className="mr-2 h-4 w-4" /> Row
                    </Button>
                </div>
                <div className="border bg-white rounded-md">
                    <ScrollArea className="max-h-96">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {dataset.columns.map(col => <TableHead key={col.id}>{col.header}</TableHead>)}
                                    <TableHead className="w-20 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dataset.data.map((row, rowIndex) => (
                                    <TableRow key={rowIndex}>
                                        {dataset.columns.map(col => {
                                            const cellValue = row[col.key] || '';
                                            return (
                                                <TableCell key={col.id} className="py-1 px-2">
                                                    {col.type === 'array' ? (
                                                        <TagInput 
                                                            value={cellValue}
                                                            onChange={(newValue) => handleUpdateCell(rowIndex, col.key, newValue)}
                                                        />
                                                    ) : (
                                                        <div
                                                            className="truncate cursor-pointer hover:bg-muted/50 p-1.5 rounded-sm h-8 flex items-center"
                                                            onClick={() => setEditingCell({ rowIndex, colKey: col.key, header: col.header, value: cellValue })}
                                                        >
                                                            {cellValue}
                                                        </div>
                                                    )}
                                                </TableCell>
                                            )
                                        })}
                                        <TableCell className="py-1 px-2 text-right">
                                            <div className="flex items-center justify-end">
                                                <Button variant="ghost" size="icon" onClick={() => handleCopyRow(rowIndex)}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteRow(rowIndex)}>
                                                    <Trash className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            </div>
        </div>
      </ScrollArea>
      {editingCell && (
        <Dialog open={!!editingCell} onOpenChange={() => setEditingCell(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit: {editingCell.header}</DialogTitle>
                    <DialogDescription>
                        Editing row {editingCell.rowIndex + 1}.
                    </DialogDescription>
                </DialogHeader>
                <Textarea
                    value={editingCell.value}
                    onChange={(e) => setEditingCell(prev => prev ? { ...prev, value: e.target.value } : null)}
                    className="min-h-[200px] text-sm"
                    rows={10}
                />
                <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingCell(null)}>Cancel</Button>
                    <Button onClick={handleSaveModal}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
});
DatasetEditor.displayName = "DatasetEditor";

export function DataManagementDialog({ isOpen, onOpenChange }: Props) {
  const { datasets, updateDatasets } = useBuilder();
  const [localDatasets, setLocalDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Deep copy to prevent mutating the original state
      const initialDatasets = JSON.parse(JSON.stringify(datasets || []));
      setLocalDatasets(initialDatasets);
      
      const selectedDatasetStillExists = initialDatasets.some((d: Dataset) => d.id === selectedDatasetId);

      // If no dataset is selected or the selected one no longer exists, select the first one.
      if (initialDatasets.length > 0 && !selectedDatasetStillExists) {
        setSelectedDatasetId(initialDatasets[0].id);
      } else if (initialDatasets.length === 0) {
        setSelectedDatasetId(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, datasets]);

  const handleSaveChanges = () => {
    updateDatasets(localDatasets);
    onOpenChange(false);
  };

  const handleAddDataset = () => {
    const newDataset: Dataset = {
        id: crypto.randomUUID(),
        name: `Dataset ${localDatasets.length + 1}`,
        columns: [{id: crypto.randomUUID(), header: 'Column 1', key: 'column_1', type: 'text'}],
        data: []
    };
    setLocalDatasets([...localDatasets, newDataset]);
    setSelectedDatasetId(newDataset.id);
  };

  const handleSelectDataset = (id: string) => {
    setSelectedDatasetId(id);
  };

  const handleDeleteDataset = (id: string) => {
    const newDatasets = localDatasets.filter(ds => ds.id !== id);
    setLocalDatasets(newDatasets);
    if (selectedDatasetId === id) {
        setSelectedDatasetId(newDatasets.length > 0 ? newDatasets[0].id : null);
    }
  };

  const handleUpdateSelectedDataset = (updatedDataset: Dataset) => {
     setLocalDatasets(prev => prev.map(ds => ds.id === selectedDatasetId ? updatedDataset : ds));
  };
  
  const selectedDataset = localDatasets.find(ds => ds.id === selectedDatasetId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b bg-slate-50">
          <DialogTitle>Data Management</DialogTitle>
          <DialogDescription>Create and manage datasets specific to this form template.</DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex overflow-hidden bg-slate-50">
            <aside className="w-[25%] border-r flex flex-col bg-white">
                <div className="p-4 border-b shrink-0 flex items-center justify-center">
                    <Button variant="outline" className="w-full justify-center" onClick={handleAddDataset}>
                        <Plus className="mr-2 h-4 w-4" /> Add New Dataset
                    </Button>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-2">
                        {localDatasets.length > 0 ? localDatasets.map(ds => (
                            <div key={ds.id} className="relative group/dataset">
                                <button onClick={() => handleSelectDataset(ds.id)} className={cn("w-full text-left px-3 py-2 truncate text-sm rounded-md", selectedDatasetId === ds.id ? 'bg-blue-50 font-semibold text-primary' : 'hover:bg-accent/50')}>
                                    {ds.name}
                                </button>
                                <div className="absolute top-1/2 -translate-y-1/2 right-1 h-6 w-6 flex opacity-0 group-hover/dataset:opacity-100">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {e.stopPropagation(); handleDeleteDataset(ds.id)}}>
                                        <Trash className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center text-sm text-muted-foreground pt-10">
                                No datasets created.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </aside>
            <main className="flex-1 flex flex-col min-h-0">
                {selectedDataset ? (
                    <DatasetEditor dataset={selectedDataset} onUpdate={handleUpdateSelectedDataset} />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                        <TableIcon className="h-12 w-12 mb-4" />
                        <h3 className="text-lg font-semibold">No Dataset Selected</h3>
                        <p className="text-sm">Select a dataset from the left panel or create a new one.</p>
                    </div>
                )}
            </main>
        </div>

        <DialogFooter className="p-4 border-t bg-slate-50">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
