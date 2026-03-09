

'use client';

import { useState, useEffect, memo } from 'react';
import { useBuilder } from '@/hooks/use-builder';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { LocalDataset, LocalDatasetColumn } from '@/lib/types';
import { Plus, Trash, Copy, X, Link, ChevronUp, ChevronDown, Table as TableIcon } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const DataLinkerDialog = ({
  isOpen,
  onOpenChange,
  datasets,
  linkedDatasetId,
  onSave,
  currentValue,
  selectionMode = 'single',
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  datasets: LocalDataset[];
  linkedDatasetId: string | undefined;
  onSave: (value: any) => void;
  currentValue: any;
  selectionMode?: 'single' | 'multiple';
}) => {
  const [internalSelection, setInternalSelection] = useState(currentValue);

  useEffect(() => {
    if (isOpen) {
      setInternalSelection(currentValue || (selectionMode === 'multiple' ? [] : null));
    }
  }, [isOpen, currentValue, selectionMode]);

  if (!isOpen || !linkedDatasetId) return null;

  const linkedDataset = datasets.find(d => d.id === linkedDatasetId);

  if (!linkedDataset) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Error</DialogTitle>
                    <DialogDescription>Linked dataset not found.</DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
  }

  const selectionKey = linkedDataset.columns[0]?.key;
  if (!selectionKey) {
      return <Dialog open={isOpen} onOpenChange={onOpenChange}><DialogContent><p>Linked dataset has no columns to select from.</p></DialogContent></Dialog>;
  }

  const handleSingleSelect = (value: any) => {
    onSave(value);
    onOpenChange(false);
  }

  const handleMultiSelectToggle = (value: any) => {
    const currentArray = Array.isArray(internalSelection) ? internalSelection : [];
    if (currentArray.includes(value)) {
      setInternalSelection(currentArray.filter(v => v !== value));
    } else {
      setInternalSelection([...currentArray, value]);
    }
  }

  const handleSaveMultiSelection = () => {
    onSave(internalSelection);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select from "{linkedDataset.name}"</DialogTitle>
          <DialogDescription>Choose a row to link to.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                {linkedDataset.columns.map(col => <TableHead key={col.id}>{col.header}</TableHead>)}
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linkedDataset.data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {linkedDataset.columns.map(col => <TableCell key={col.id}>{String(row[col.key] ?? '')}</TableCell>)}
                  <TableCell>
                    {selectionMode === 'single' ? (
                      <Button size="sm" onClick={() => handleSingleSelect(row[selectionKey])}>Select</Button>
                    ) : (
                      <Checkbox 
                        checked={Array.isArray(internalSelection) && internalSelection.includes(row[selectionKey])}
                        onCheckedChange={() => handleMultiSelectToggle(row[selectionKey])}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        {selectionMode === 'multiple' && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSaveMultiSelection}>Done</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};


const ColumnLinkDialog = ({
  isOpen,
  onOpenChange,
  column,
  datasets,
  onSave,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  column: LocalDatasetColumn | null;
  datasets: LocalDataset[];
  onSave: (link: { linkedDatasetId?: string; linkedFieldKey?: string }) => void;
}) => {
  const [linkedDatasetId, setLinkedDatasetId] = useState(column?.linkedDatasetId || '');
  const [linkedFieldKey, setLinkedFieldKey] = useState(column?.linkedFieldKey || '');

  useEffect(() => {
    setLinkedDatasetId(column?.linkedDatasetId || '');
    setLinkedFieldKey(column?.linkedFieldKey || '');
  }, [column]);
  
  const targetDataset = datasets.find(d => d.id === linkedDatasetId);

  const handleSave = () => {
    onSave({
      linkedDatasetId: linkedDatasetId || undefined,
      linkedFieldKey: linkedFieldKey || undefined,
    });
    onOpenChange(false);
  };

  const handleClear = () => {
    onSave({ linkedDatasetId: undefined, linkedFieldKey: undefined });
    onOpenChange(false);
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link Column to Another Dataset</DialogTitle>
          <DialogDescription>
            Use this column's value to look up a row in another dataset.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Target Dataset</Label>
            <Select value={linkedDatasetId} onValueChange={setLinkedDatasetId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a dataset to link to..." />
              </SelectTrigger>
              <SelectContent>
                {datasets.filter(d => d.id !== column?.id).map(d => ( // Exclude self
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {linkedDatasetId && (
            <div className="space-y-2">
              <Label>Target Field (in "{targetDataset?.name}")</Label>
              <Select value={linkedFieldKey} onValueChange={setLinkedFieldKey} disabled={!targetDataset}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a field to match on..." />
                </SelectTrigger>
                <SelectContent>
                  {targetDataset?.columns.map(c => (
                    <SelectItem key={c.id} value={c.key}>{c.header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          {column?.linkedDatasetId && <Button variant="destructive" onClick={handleClear}>Remove Link</Button>}
          <div className='flex-grow' />
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!linkedDatasetId || !linkedFieldKey}>Save Link</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

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

const LocalDatasetEditor = memo(({ dataset, onUpdate, allDatasets }: { dataset: LocalDataset, onUpdate: (updated: LocalDataset) => void, allDatasets: LocalDataset[] }) => {
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; colKey: string; header: string; value: string } | null>(null);
  const [editingListCell, setEditingListCell] = useState<{ rowIndex: number; colKey: string; header: string; value: string[] } | null>(null);
  const [linkingColumn, setLinkingColumn] = useState<LocalDatasetColumn | null>(null);
  const [linkingDataCell, setLinkingDataCell] = useState<{ rowIndex: number; colKey: string; linkedDatasetId: string; selectionMode: 'single' | 'multiple'; currentValue: any } | null>(null);
  const [idPrefix, setIdPrefix] = useState('');
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...dataset, name: e.target.value });
  };
  
  const handleAddColumn = () => {
    const newColumn: LocalDatasetColumn = {
        id: crypto.randomUUID(),
        header: `Column ${dataset.columns.length + 1}`,
        key: `column_${dataset.columns.length + 1}`.toLowerCase(),
        type: 'text',
    };
    onUpdate({ ...dataset, columns: [...dataset.columns, newColumn] });
  };
  
  const handleUpdateColumn = (colId: string, updates: Partial<LocalDatasetColumn>) => {
    let newColumns = dataset.columns.map(c => (c.id === colId ? { ...c, ...updates } : c));
    let newData = [...dataset.data];

    if (updates.type === 'order') {
        const updatedColumn = newColumns.find(c => c.id === colId);
        // Ensure only one order column exists
        newColumns.forEach(c => {
            if (c.id !== colId && c.type === 'order') c.type = 'text';
        });
        // Update data with order numbers
        if (updatedColumn) {
            newData = newData.map((row, index) => ({...row, [updatedColumn.key]: index + 1}));
        }
    }
    
    onUpdate({ ...dataset, columns: newColumns, data: newData });
  };

  const handleDeleteColumn = (colId: string) => {
    onUpdate({ ...dataset, columns: dataset.columns.filter(c => c.id !== colId) });
  };
  
  const handleAddRow = () => {
    const newRow = dataset.columns.reduce((acc, col) => {
        acc[col.key] = col.type === 'array' ? [] : '';
        return acc;
    }, {} as Record<string, any>);
    
    const idColumn = dataset.columns.find(c => c.key.toLowerCase() === 'id');
    if (idColumn) {
        const prefix = idPrefix.trim().replace(/\s+/g, '_') || dataset.name.slice(0, 3).toLowerCase();
        const newId = `${prefix}-${crypto.randomUUID().slice(0, 6)}`;
        newRow[idColumn.key] = newId;
    }

    const orderColumn = dataset.columns.find(c => c.type === 'order');
    if (orderColumn) {
        newRow[orderColumn.key] = dataset.data.length + 1;
    }

    onUpdate({ ...dataset, data: [...dataset.data, newRow] });
  };

  const handleUpdateCell = (rowIndex: number, colKey: string, value: any) => {
    const newData = [...dataset.data];
    newData[rowIndex] = { ...newData[rowIndex], [colKey]: value };
    onUpdate({ ...dataset, data: newData });
  };
  
  const handleDeleteRow = (rowIndex: number) => {
    let newData = dataset.data.filter((_, i) => i !== rowIndex);
    const orderColumn = dataset.columns.find(c => c.type === 'order');
    if (orderColumn) {
        newData = newData.map((row, i) => ({
            ...row,
            [orderColumn.key]: i + 1,
        }));
    }
    onUpdate({ ...dataset, data: newData });
  };

  const handleCopyRow = (rowIndex: number) => {
    const rowToCopy = JSON.parse(JSON.stringify(dataset.data[rowIndex]));
    const newData = [...dataset.data];
    newData.splice(rowIndex + 1, 0, rowToCopy);
    onUpdate({ ...dataset, data: newData });
  };

  const handleMoveRow = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === dataset.data.length - 1)) {
        return;
    }
    const newData = [...dataset.data];
    const [movedRow] = newData.splice(index, 1);
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    newData.splice(newIndex, 0, movedRow);
    
    const orderColumn = dataset.columns.find(c => c.type === 'order');
    if (orderColumn) {
        newData.forEach((row, i) => {
            row[orderColumn.key] = i + 1;
        });
    }

    onUpdate({ ...dataset, data: newData });
  };

  const handleSaveModal = () => {
    if (editingCell) {
        handleUpdateCell(editingCell.rowIndex, editingCell.colKey, editingCell.value);
        setEditingCell(null);
    }
  };

  const handleSaveListModal = () => {
    if (editingListCell) {
        handleUpdateCell(editingListCell.rowIndex, editingListCell.colKey, editingListCell.value);
        setEditingListCell(null);
    }
  };

  const handleSaveLink = (link: { linkedDatasetId?: string; linkedFieldKey?: string }) => {
    if (linkingColumn) {
      handleUpdateColumn(linkingColumn.id, link);
    }
  };

  const handleCellClick = (rowIndex: number, col: LocalDatasetColumn) => {
    const cellValue = dataset.data[rowIndex][col.key] || (col.type === 'array' ? [] : '');

    if (col.linkedDatasetId) {
        setLinkingDataCell({
          rowIndex,
          colKey: col.key,
          linkedDatasetId: col.linkedDatasetId,
          selectionMode: col.type === 'array' ? 'multiple' : 'single',
          currentValue: cellValue,
        });
    } else if (col.type === 'array') {
        setEditingListCell({ rowIndex, colKey: col.key, header: col.header, value: Array.isArray(cellValue) ? cellValue : [] });
    } else {
        setEditingCell({ rowIndex, colKey: col.key, header: col.header, value: String(cellValue) });
    }
  };

  const handleSaveLinkedData = (value: any) => {
    if (linkingDataCell) {
        handleUpdateCell(linkingDataCell.rowIndex, linkingDataCell.colKey, value);
    }
    setLinkingDataCell(null);
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
                    <Button variant="outline" size="sm" onClick={handleAddColumn}><Plus className="mr-2 h-4 w-4" /> Column</Button>
                </div>
                <div className="border bg-white p-4 rounded-md">
                    <Table>
                        <TableHeader><TableRow><TableHead>Header</TableHead><TableHead>Key</TableHead><TableHead>Type</TableHead><TableHead className="w-10 text-center">Link</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                        <TableBody>
                            {dataset.columns.map(col => (
                                <TableRow key={col.id}>
                                    <TableCell className="py-1 px-2"><Input defaultValue={col.header} onBlur={(e) => handleUpdateColumn(col.id, { header: e.target.value })} className="h-8"/></TableCell>
                                    <TableCell className="py-1 px-2"><Input defaultValue={col.key} onBlur={(e) => handleUpdateColumn(col.id, { key: e.target.value.replace(/\s+/g, '_').toLowerCase() })} className="h-8"/></TableCell>
                                    <TableCell className="py-1 px-2">
                                        <Select value={col.type || 'text'} onValueChange={(value) => handleUpdateColumn(col.id, { type: value as any })}>
                                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="text">Text</SelectItem>
                                                <SelectItem value="array">List</SelectItem>
                                                <SelectItem value="order">Order Number</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="py-1 px-2 text-center">
                                      <Button variant="ghost" size="icon" onClick={() => setLinkingColumn(col)} className={cn(col.linkedDatasetId && 'text-primary')}>
                                        <Link className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                    <TableCell className="py-1 px-2"><Button variant="ghost" size="icon" onClick={() => handleDeleteColumn(col.id)}><Trash className="h-4 w-4 text-destructive" /></Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
            
            <div className="space-y-4">
                <div className="p-3 bg-primary/10 rounded-md flex justify-between items-center">
                    <h3 className="font-semibold text-primary">Data Rows</h3>
                    <div className="flex items-center gap-2">
                        <Input 
                            placeholder="ID prefix..."
                            value={idPrefix}
                            onChange={(e) => setIdPrefix(e.target.value)}
                            className="h-8 text-xs w-32 bg-white"
                        />
                        <Button variant="outline" size="sm" onClick={handleAddRow}><Plus className="mr-2 h-4 w-4" /> Row</Button>
                    </div>
                </div>
                <div className="border bg-white rounded-md">
                    <ScrollArea className="max-h-96">
                        <Table>
                            <TableHeader><TableRow>{dataset.columns.map(col => <TableHead key={col.id}>{col.header}</TableHead>)}<TableHead className="w-[150px] text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {dataset.data.map((row, rowIndex) => (
                                    <TableRow key={rowIndex}>
                                        {dataset.columns.map(col => {
                                            const cellValue = row[col.key];
                                            const displayValue = Array.isArray(cellValue)
                                                ? cellValue.join(', ')
                                                : cellValue ?? '';

                                            return (
                                                <TableCell key={col.id} className="py-1 px-2">
                                                    <div className={cn("truncate p-1.5 rounded-sm h-8 flex items-center", col.type !== 'order' && "cursor-pointer hover:bg-muted/50")} onClick={() => col.type !== 'order' && handleCellClick(rowIndex, col)}>
                                                        {displayValue || (col.type === 'array' ? <span className="text-muted-foreground italic">Empty list</span> : '')}
                                                    </div>
                                                </TableCell>
                                            )
                                        })}
                                        <TableCell className="py-1 px-2 text-right">
                                            <div className="flex items-center justify-end">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMoveRow(rowIndex, 'up')} disabled={rowIndex === 0}><ChevronUp className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMoveRow(rowIndex, 'down')} disabled={rowIndex === dataset.data.length - 1}><ChevronDown className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyRow(rowIndex)}><Copy className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteRow(rowIndex)}><Trash className="h-4 w-4 text-destructive" /></Button>
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
      {editingCell && (<Dialog open={!!editingCell} onOpenChange={() => setEditingCell(null)}><DialogContent><DialogHeader><DialogTitle>Edit: {editingCell.header}</DialogTitle><DialogDescription>Editing row {editingCell.rowIndex + 1}.</DialogDescription></DialogHeader><Textarea value={editingCell.value} onChange={(e) => setEditingCell(prev => prev ? { ...prev, value: e.target.value } : null)} className="min-h-[200px] text-sm" rows={10}/><DialogFooter><Button variant="outline" onClick={() => setEditingCell(null)}>Cancel</Button><Button onClick={handleSaveModal}>Save</Button></DialogFooter></DialogContent></Dialog>)}
      {editingListCell && (<Dialog open={!!editingListCell} onOpenChange={() => setEditingListCell(null)}><DialogContent><DialogHeader><DialogTitle>Edit List: {editingListCell.header}</DialogTitle><DialogDescription>Editing row {editingListCell.rowIndex + 1}. Add or remove items from the list.</DialogDescription></DialogHeader><div className="py-4"><TagInput value={editingListCell.value} onChange={(newValue) => setEditingListCell(prev => prev ? { ...prev, value: newValue } : null)} /></div><DialogFooter><Button variant="outline" onClick={() => setEditingListCell(null)}>Cancel</Button><Button onClick={handleSaveListModal}>Save</Button></DialogFooter></DialogContent></Dialog>)}
      <ColumnLinkDialog 
        isOpen={!!linkingColumn}
        onOpenChange={() => setLinkingColumn(null)}
        column={linkingColumn}
        datasets={allDatasets}
        onSave={handleSaveLink}
      />
      <DataLinkerDialog
        isOpen={!!linkingDataCell}
        onOpenChange={() => setLinkingDataCell(null)}
        datasets={allDatasets}
        linkedDatasetId={linkingDataCell?.linkedDatasetId}
        onSave={handleSaveLinkedData}
        currentValue={linkingDataCell?.currentValue}
        selectionMode={linkingDataCell?.selectionMode}
      />
    </div>
  );
});
LocalDatasetEditor.displayName = "LocalDatasetEditor";

export function DataManagementDialog({ isOpen, onOpenChange }: Props) {
  const { localDatasets, updateLocalDatasets } = useBuilder();
  const [simpleDatasets, setSimpleDatasets] = useState<LocalDataset[]>([]);
  const [selectedSimpleDatasetId, setSelectedSimpleDatasetId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Deep copy the datasets from props to create a local, editable copy for the dialog session.
      // This should only run when the dialog is opened, not on subsequent re-renders caused by state changes inside this dialog.
      const localCopyOfDatasets = JSON.parse(JSON.stringify(localDatasets || []));
      setSimpleDatasets(localCopyOfDatasets);
      
      const stillExists = localCopyOfDatasets.some((d: LocalDataset) => d.id === selectedSimpleDatasetId);
      if (localCopyOfDatasets.length > 0 && (!selectedSimpleDatasetId || !stillExists)) {
        setSelectedSimpleDatasetId(localCopyOfDatasets[0].id);
      } else if (localCopyOfDatasets.length === 0) {
        setSelectedSimpleDatasetId(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
  
  const handleSaveChanges = () => {
    updateLocalDatasets(simpleDatasets);
    onOpenChange(false);
  };

  const handleAddSimpleDataset = () => {
    const newDataset: LocalDataset = {
        id: crypto.randomUUID(),
        name: `Dataset ${simpleDatasets.length + 1}`,
        columns: [{id: crypto.randomUUID(), header: 'ID', key: 'id', type: 'text'}],
        data: []
    };
    setSimpleDatasets(prev => [...prev, newDataset]);
    setSelectedSimpleDatasetId(newDataset.id);
  };
  
  const handleDeleteSimpleDataset = (id: string) => {
    setSimpleDatasets(prev => {
      const newDatasets = prev.filter(ds => ds.id !== id);
      if (selectedSimpleDatasetId === id) {
          setSelectedSimpleDatasetId(newDatasets.length > 0 ? newDatasets[0].id : null);
      }
      return newDatasets;
    });
  };

  const handleUpdateSelectedSimpleDataset = (updatedDataset: LocalDataset) => {
     setSimpleDatasets(prev => prev.map(ds => ds.id === selectedSimpleDatasetId ? updatedDataset : ds));
  };
  
  const selectedSimpleDataset = simpleDatasets.find(ds => ds.id === selectedSimpleDatasetId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Data Management</DialogTitle>
          <DialogDescription>Create and manage datasets for this form.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-row overflow-hidden bg-slate-50 h-full">
            <aside className="w-[25%] border-r flex flex-col bg-white">
                <div className="p-4 border-b shrink-0 flex items-center justify-center">
                    <Button variant="outline" className="w-full justify-center" onClick={handleAddSimpleDataset}>
                        <Plus className="mr-2 h-4 w-4" /> Add New Dataset
                    </Button>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-2">
                        {simpleDatasets.length > 0 ? simpleDatasets.map(ds => (
                            <div key={ds.id} className="relative group/dataset">
                                <button onClick={() => setSelectedSimpleDatasetId(ds.id)} className={cn("w-full text-left px-3 py-2 truncate text-sm rounded-md", selectedSimpleDatasetId === ds.id ? 'bg-blue-50 font-semibold text-primary' : 'hover:bg-accent/50')}>
                                    {ds.name}
                                </button>
                                <div className="absolute top-1/2 -translate-y-1/2 right-1 h-6 w-6 flex opacity-0 group-hover/dataset:opacity-100">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {e.stopPropagation(); handleDeleteSimpleDataset(ds.id)}}><Trash className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center text-sm text-muted-foreground pt-10">No datasets created.</div>
                        )}
                    </div>
                </ScrollArea>
            </aside>
            <main className="flex-1 flex flex-col min-h-0">
                {selectedSimpleDataset ? (
                    <LocalDatasetEditor 
                      dataset={selectedSimpleDataset} 
                      onUpdate={handleUpdateSelectedSimpleDataset}
                      allDatasets={simpleDatasets}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                        <TableIcon className="h-12 w-12 mb-4" />
                        <h3 className="text-lg font-semibold">No Dataset Selected</h3>
                        <p className="text-sm">Select a dataset from the left panel or create a new one.</p>
                    </div>
                )}
            </main>
        </div>

        <DialogFooter className="p-4 border-t">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
