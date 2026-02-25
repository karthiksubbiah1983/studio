

'use client';

import { useState, useEffect, memo, useMemo } from 'react';
import { useBuilder } from '@/hooks/use-builder';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { LocalDataset, LocalDatasetColumn, AdvancedDataset, AdvancedColumn, AdvancedRow } from '@/lib/types';
import { Plus, Trash, Copy, Edit, Table as TableIcon, X, Link as LinkIcon, CheckboxIcon, Check, Calendar as CalendarIcon, ChevronsUpDown } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

// #region Simple Datasets Components

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

const LocalDatasetEditor = memo(({ dataset, onUpdate }: { dataset: LocalDataset, onUpdate: (updated: LocalDataset) => void }) => {
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; colKey: string; header: string; value: string } | null>(null);
  const [editingListCell, setEditingListCell] = useState<{ rowIndex: number; colKey: string; header: string; value: string[] } | null>(null);
  
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
  
  const handleUpdateColumn = (colId: string, field: 'header' | 'key' | 'type', value: string) => {
    const newColumns = dataset.columns.map(c => (c.id === colId ? { ...c, [field]: value } : c));
    onUpdate({ ...dataset, columns: newColumns });
  };

  const handleDeleteColumn = (colId: string) => {
    onUpdate({ ...dataset, columns: dataset.columns.filter(c => c.id !== colId) });
  };
  
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
    onUpdate({ ...dataset, data: dataset.data.filter((_, i) => i !== rowIndex) });
  };

  const handleCopyRow = (rowIndex: number) => {
    const rowToCopy = JSON.parse(JSON.stringify(dataset.data[rowIndex]));
    const newData = [...dataset.data];
    newData.splice(rowIndex + 1, 0, rowToCopy);
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
                        <TableHeader><TableRow><TableHead className="w-[40%]">Header</TableHead><TableHead className="w-[40%]">Key</TableHead><TableHead className="w-[20%]">Type</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                        <TableBody>
                            {dataset.columns.map(col => (
                                <TableRow key={col.id}>
                                    <TableCell className="py-1 px-2"><Input defaultValue={col.header} onBlur={(e) => handleUpdateColumn(col.id, 'header', e.target.value)} className="h-8"/></TableCell>
                                    <TableCell className="py-1 px-2"><Input defaultValue={col.key} onBlur={(e) => handleUpdateColumn(col.id, 'key', e.target.value.replace(/\s+/g, '_').toLowerCase())} className="h-8"/></TableCell>
                                    <TableCell className="py-1 px-2">
                                        <Select value={col.type || 'text'} onValueChange={(value) => handleUpdateColumn(col.id, 'type', value)}>
                                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent><SelectItem value="text">Text</SelectItem><SelectItem value="array">List</SelectItem></SelectContent>
                                        </Select>
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
                    <Button variant="outline" size="sm" onClick={handleAddRow}><Plus className="mr-2 h-4 w-4" /> Row</Button>
                </div>
                <div className="border bg-white rounded-md">
                    <ScrollArea className="max-h-96">
                        <Table>
                            <TableHeader><TableRow>{dataset.columns.map(col => <TableHead key={col.id}>{col.header}</TableHead>)}<TableHead className="w-20 text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {dataset.data.map((row, rowIndex) => (
                                    <TableRow key={rowIndex}>
                                        {dataset.columns.map(col => {
                                            const cellValue = row[col.key] || '';
                                            return (
                                                <TableCell key={col.id} className="py-1 px-2">
                                                    {col.type === 'array' ? (
                                                        <div className="truncate cursor-pointer hover:bg-muted/50 p-1.5 rounded-sm h-8 flex items-center" onClick={() => setEditingListCell({ rowIndex, colKey: col.key, header: col.header, value: Array.isArray(cellValue) ? cellValue : [] })}>
                                                            {Array.isArray(cellValue) && cellValue.length > 0 ? cellValue.join(', ') : <span className="text-muted-foreground italic">Empty list</span>}
                                                        </div>
                                                    ) : (
                                                        <div className="truncate cursor-pointer hover:bg-muted/50 p-1.5 rounded-sm h-8 flex items-center" onClick={() => setEditingCell({ rowIndex, colKey: col.key, header: col.header, value: cellValue })}>
                                                            {cellValue}
                                                        </div>
                                                    )}
                                                </TableCell>
                                            )
                                        })}
                                        <TableCell className="py-1 px-2 text-right"><div className="flex items-center justify-end"><Button variant="ghost" size="icon" onClick={() => handleCopyRow(rowIndex)}><Copy className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDeleteRow(rowIndex)}><Trash className="h-4 w-4 text-destructive" /></Button></div></TableCell>
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
    </div>
  );
});
LocalDatasetEditor.displayName = "LocalDatasetEditor";

// #endregion Simple Datasets Components


// #region Advanced Datasets Components

const AdvancedColumnEditor = ({
  isOpen,
  onOpenChange,
  column: initialColumn,
  onSave,
  allDatasets,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  column: Partial<AdvancedColumn> | null;
  onSave: (column: AdvancedColumn) => void;
  allDatasets: AdvancedDataset[];
}) => {
  const [column, setColumn] = useState<Partial<AdvancedColumn> | null>(null);

  useEffect(() => {
    if (isOpen && initialColumn) {
      setColumn(JSON.parse(JSON.stringify(initialColumn)));
    }
  }, [isOpen, initialColumn]);
  
  if (!column) return null;

  const handleSave = () => {
      if (column.name?.trim()) {
        onSave(column as AdvancedColumn);
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{column.id ? 'Edit' : 'Add'} Column</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>Column Name</Label>
            <Input value={column.name || ''} onChange={(e) => setColumn({ ...column, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Column Type</Label>
            <Select value={column.type || 'text'} onValueChange={(type: AdvancedColumn['type']) => setColumn({ ...column, type })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="link">Link to Record</SelectItem>
                </SelectContent>
            </Select>
          </div>
          {column.type === 'link' && (
            <div className='border-t pt-4 space-y-4'>
                <div className="space-y-2">
                    <Label>Link to Table</Label>
                    <Select value={column.linkToDatasetId || ''} onValueChange={(id) => setColumn({ ...column, linkToDatasetId: id })}>
                        <SelectTrigger><SelectValue placeholder="Select a table..."/></SelectTrigger>
                        <SelectContent>
                            {allDatasets.map(ds => (
                                <SelectItem key={ds.id} value={ds.id}>{ds.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="flex items-center space-x-2">
                    <Checkbox id="allow-multiple" checked={column.allowMultipleLinks} onCheckedChange={checked => setColumn({...column, allowMultipleLinks: !!checked})} />
                    <Label htmlFor="allow-multiple">Allow multiple links</Label>
                </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const LinkSelector = ({
  allDatasets,
  column,
  currentValue,
  onSave,
}: {
  allDatasets: AdvancedDataset[];
  column: AdvancedColumn;
  currentValue: any;
  onSave: (newValue: any) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const linkedDataset = allDatasets.find(ds => ds.id === column.linkToDatasetId);

  useEffect(() => {
    if (isOpen) {
        const current = Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue] : []);
        setSelectedIds(current);
    }
  }, [isOpen, currentValue]);

  const handleToggle = (id: string) => {
    if (column.allowMultipleLinks) {
        const newSelectedIds = selectedIds.includes(id)
            ? selectedIds.filter(i => i !== id)
            : [...selectedIds, id];
        setSelectedIds(newSelectedIds);
    } else {
        setSelectedIds([id]);
        onSave(id);
        setIsOpen(false);
    }
  };

  const handleConfirm = () => {
    if (column.allowMultipleLinks) {
        onSave(selectedIds);
    }
    setIsOpen(false);
  }
  
  if (!linkedDataset) return <Badge variant="destructive">Linked table not found</Badge>;

  const primaryColumnKey = linkedDataset.columns[0]?.id || 'id';

  const getDisplayValue = () => {
    if (!currentValue || (Array.isArray(currentValue) && currentValue.length === 0)) {
        return <span className="text-muted-foreground">Select...</span>;
    }
    
    const ids = Array.isArray(currentValue) ? currentValue : [currentValue];
    const values = ids.map(id => {
        const row = linkedDataset.rows.find(r => r.id === id);
        return row ? row.data[primaryColumnKey] : id;
    });
    
    return values.join(', ');
  }

  return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between font-normal truncate">
            {getDisplayValue()}
            <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
            className="w-[var(--radix-popover-trigger-width)] p-0"
            onMouseDown={(e) => e.preventDefault()}
        >
          <div className="p-2">
            <h4 className="font-medium text-sm px-2 py-1">{linkedDataset.name}</h4>
          </div>
          <ScrollArea className="max-h-60">
            <div className="p-1">
              {linkedDataset.rows.map(row => (
                <div 
                  key={row.id} 
                  className="flex items-center gap-2 p-2 rounded-sm hover:bg-accent cursor-pointer"
                  onClick={() => handleToggle(row.id)}
                >
                   <Checkbox 
                        id={`link-${row.id}`} 
                        checked={selectedIds.includes(row.id)}
                        readOnly 
                   />
                   <Label htmlFor={`link-${row.id}`} className="text-sm font-normal flex-1 cursor-pointer">
                       {row.data[primaryColumnKey]}
                   </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
           {column.allowMultipleLinks && (
                <div className="p-2 border-t">
                    <Button className="w-full" size="sm" onClick={handleConfirm}>Confirm</Button>
                </div>
            )}
        </PopoverContent>
      </Popover>
  );
};


const AdvancedDatasetEditor = memo(({ dataset, allDatasets, onUpdate }: { dataset: AdvancedDataset; allDatasets: AdvancedDataset[]; onUpdate: (updatedDataset: AdvancedDataset) => void; }) => {
    const [editingColumn, setEditingColumn] = useState<Partial<AdvancedColumn> | null>(null);
    const [isColumnEditorOpen, setIsColumnEditorOpen] = useState(false);

    const handleUpdateDataset = (updates: Partial<AdvancedDataset>) => {
        onUpdate({ ...dataset, ...updates });
    };

    const handleAddColumn = () => {
        setEditingColumn({ type: 'text' });
        setIsColumnEditorOpen(true);
    };

    const handleEditColumn = (column: AdvancedColumn) => {
        setEditingColumn(column);
        setIsColumnEditorOpen(true);
    };
    
    const handleDeleteColumn = (id: string) => {
        handleUpdateDataset({ columns: dataset.columns.filter(c => c.id !== id) });
    };

    const handleSaveColumn = (colToSave: AdvancedColumn) => {
        let newColumns;
        if (colToSave.id) {
            newColumns = dataset.columns.map(c => c.id === colToSave.id ? colToSave : c);
        } else {
            newColumns = [...dataset.columns, { ...colToSave, id: crypto.randomUUID() }];
        }
        handleUpdateDataset({ columns: newColumns });
        setIsColumnEditorOpen(false);
    };
    
    const handleAddRow = () => {
        const newRow: AdvancedRow = { id: crypto.randomUUID(), data: {} };
        handleUpdateDataset({ rows: [...dataset.rows, newRow] });
    };

    const handleUpdateCell = (rowIndex: number, colId: string, value: any) => {
        const newRows = [...dataset.rows];
        newRows[rowIndex] = {
            ...newRows[rowIndex],
            data: {
                ...newRows[rowIndex].data,
                [colId]: value,
            }
        };
        handleUpdateDataset({ rows: newRows });
    };

    const handleDeleteRow = (rowId: string) => {
        handleUpdateDataset({ rows: dataset.rows.filter(r => r.id !== rowId) });
    };

    const renderCell = (row: AdvancedRow, rowIndex: number, column: AdvancedColumn) => {
        const value = row.data[column.id];

        switch(column.type) {
            case 'text':
                return <Input defaultValue={value || ''} onBlur={e => handleUpdateCell(rowIndex, column.id, e.target.value)} className="h-8" />;
            case 'number':
                return <Input type="number" defaultValue={value || ''} onBlur={e => handleUpdateCell(rowIndex, column.id, parseFloat(e.target.value))} className="h-8" />;
            case 'boolean':
                return <div className="flex justify-center items-center h-8"><Checkbox checked={!!value} onCheckedChange={checked => handleUpdateCell(rowIndex, column.id, !!checked)} /></div>;
            case 'date':
                return (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 w-full font-normal justify-start">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {value ? format(new Date(value), 'PPP') : 'Select date'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                            <Calendar mode="single" selected={value ? new Date(value) : undefined} onSelect={date => handleUpdateCell(rowIndex, column.id, date?.toISOString())} />
                        </PopoverContent>
                    </Popover>
                );
            case 'link':
                return <LinkSelector allDatasets={allDatasets} column={column} currentValue={value} onSave={newValue => handleUpdateCell(rowIndex, column.id, newValue)} />;
            default:
                return null;
        }
    };
    
    return (
        <div className="h-full relative">
            <ScrollArea className="h-full">
                <div className="space-y-6 p-6">
                    <div>
                        <Label>Table Name</Label>
                        <Input value={dataset.name} onChange={(e) => handleUpdateDataset({ name: e.target.value })} className="mt-1 bg-white font-medium text-lg" />
                    </div>

                    <div className="space-y-2">
                        <div className="p-3 bg-primary/10 rounded-md flex justify-between items-center">
                            <h3 className="font-semibold text-primary">Columns</h3>
                            <Button variant="outline" size="sm" onClick={handleAddColumn}><Plus className="mr-2 h-4 w-4" /> Column</Button>
                        </div>
                        <div className="border bg-white rounded-md p-2 space-y-1">
                            {dataset.columns.map(col => (
                                <div key={col.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 group">
                                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="flex-1 font-medium text-sm">{col.name}</span>
                                    <Badge variant="outline" className="font-normal">{col.type}</Badge>
                                    <div className="opacity-0 group-hover:opacity-100">
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditColumn(col)}><Edit className="h-3 w-3" /></Button>
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteColumn(col.id)}><Trash className="h-3 w-3 text-destructive" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="p-3 bg-primary/10 rounded-md flex justify-between items-center">
                            <h3 className="font-semibold text-primary">Data Rows</h3>
                            <Button variant="outline" size="sm" onClick={handleAddRow}><Plus className="mr-2 h-4 w-4" /> Row</Button>
                        </div>
                         <div className="border bg-white rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {dataset.columns.map(col => <TableHead key={col.id}>{col.name}</TableHead>)}
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dataset.rows.map((row, rowIndex) => (
                                        <TableRow key={row.id}>
                                            {dataset.columns.map(col => (
                                                <TableCell key={col.id} className="py-1 px-2">
                                                    {renderCell(row, rowIndex, col)}
                                                </TableCell>
                                            ))}
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteRow(row.id)}><Trash className="h-4 w-4 text-destructive" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         </div>
                    </div>
                </div>
            </ScrollArea>
             <AdvancedColumnEditor
                isOpen={isColumnEditorOpen}
                onOpenChange={setIsColumnEditorOpen}
                column={editingColumn}
                onSave={handleSaveColumn}
                allDatasets={allDatasets}
            />
        </div>
    );
});
AdvancedDatasetEditor.displayName = "AdvancedDatasetEditor";


const AdvancedDatasetsTab = ({ 
    datasets, 
    setDatasets 
}: { 
    datasets: AdvancedDataset[], 
    setDatasets: (datasets: AdvancedDataset[]) => void 
}) => {
    const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);

    useEffect(() => {
        if (datasets.length > 0 && !datasets.some(d => d.id === selectedDatasetId)) {
            setSelectedDatasetId(datasets[0].id);
        } else if (datasets.length === 0) {
            setSelectedDatasetId(null);
        }
    }, [datasets, selectedDatasetId]);

    const handleAddDataset = () => {
        const newDataset: AdvancedDataset = {
            id: crypto.randomUUID(),
            name: `New Table ${datasets.length + 1}`,
            columns: [{ id: 'col_primary', name: 'Primary Column', type: 'text' }],
            rows: [],
        };
        setDatasets([...datasets, newDataset]);
        setSelectedDatasetId(newDataset.id);
    };

    const handleDeleteDataset = (id: string) => {
        setDatasets(datasets.filter(ds => ds.id !== id));
    };
    
    const handleUpdateDataset = (updatedDataset: AdvancedDataset) => {
        setDatasets(datasets.map(ds => ds.id === updatedDataset.id ? updatedDataset : ds));
    };

    const selectedDataset = datasets.find(ds => ds.id === selectedDatasetId);

    return (
        <div className="flex-1 flex overflow-hidden bg-slate-50">
            <aside className="w-[25%] border-r flex flex-col bg-white">
                <div className="p-4 border-b shrink-0 flex items-center justify-center">
                    <Button variant="outline" className="w-full justify-center" onClick={handleAddDataset}>
                        <Plus className="mr-2 h-4 w-4" /> Add New Table
                    </Button>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-2">
                        {datasets.length > 0 ? datasets.map(ds => (
                            <div key={ds.id} className="relative group/dataset">
                                <button onClick={() => setSelectedDatasetId(ds.id)} className={cn("w-full text-left px-3 py-2 truncate text-sm rounded-md", selectedDatasetId === ds.id ? 'bg-blue-50 font-semibold text-primary' : 'hover:bg-accent/50')}>
                                    {ds.name}
                                </button>
                                <div className="absolute top-1/2 -translate-y-1/2 right-1 h-6 w-6 flex opacity-0 group-hover/dataset:opacity-100">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {e.stopPropagation(); handleDeleteDataset(ds.id)}}><Trash className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center text-sm text-muted-foreground pt-10">No tables created.</div>
                        )}
                    </div>
                </ScrollArea>
            </aside>
            <main className="flex-1 flex flex-col min-h-0">
                {selectedDataset ? (
                    <AdvancedDatasetEditor dataset={selectedDataset} allDatasets={datasets} onUpdate={handleUpdateDataset} />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                        <TableIcon className="h-12 w-12 mb-4" />
                        <h3 className="text-lg font-semibold">No Table Selected</h3>
                        <p className="text-sm">Select a table from the left panel or create a new one.</p>
                    </div>
                )}
            </main>
        </div>
    )
};


// #endregion Advanced Datasets Components

export function DataManagementDialog({ isOpen, onOpenChange }: Props) {
  const { localDatasets, updateLocalDatasets, advancedDatasets, updateAdvancedDatasets } = useBuilder();
  const [activeTab, setActiveTab] = useState('simple');
  
  // State for simple datasets tab
  const [simpleDatasets, setSimpleDatasets] = useState<LocalDataset[]>([]);
  const [selectedSimpleDatasetId, setSelectedSimpleDatasetId] = useState<string | null>(null);

  // State for advanced datasets tab
  const [localAdvancedDatasets, setLocalAdvancedDatasets] = useState<AdvancedDataset[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Simple Datasets
      const initialSimple = JSON.parse(JSON.stringify(localDatasets || []));
      setSimpleDatasets(initialSimple);
      const selectedSimpleExists = initialSimple.some((d: LocalDataset) => d.id === selectedSimpleDatasetId);
      if (initialSimple.length > 0 && !selectedSimpleExists) {
        setSelectedSimpleDatasetId(initialSimple[0].id);
      } else if (initialSimple.length === 0) {
        setSelectedSimpleDatasetId(null);
      }

      // Advanced Datasets
      const initialAdvanced = JSON.parse(JSON.stringify(advancedDatasets || []));
      setLocalAdvancedDatasets(initialAdvanced);
    }
  }, [isOpen, localDatasets, advancedDatasets, selectedSimpleDatasetId]);

  const handleSaveChanges = () => {
    if (activeTab === 'simple') {
      updateLocalDatasets(simpleDatasets);
    } else {
      updateAdvancedDatasets(localAdvancedDatasets);
    }
    onOpenChange(false);
  };

  const handleAddSimpleDataset = () => {
    const newDataset: LocalDataset = {
        id: crypto.randomUUID(),
        name: `Dataset ${simpleDatasets.length + 1}`,
        columns: [{id: crypto.randomUUID(), header: 'Column 1', key: 'column_1', type: 'text'}],
        data: []
    };
    setSimpleDatasets([...simpleDatasets, newDataset]);
    setSelectedSimpleDatasetId(newDataset.id);
  };
  
  const handleDeleteSimpleDataset = (id: string) => {
    const newDatasets = simpleDatasets.filter(ds => ds.id !== id);
    setSimpleDatasets(newDatasets);
    if (selectedSimpleDatasetId === id) {
        setSelectedSimpleDatasetId(newDatasets.length > 0 ? newDatasets[0].id : null);
    }
  };

  const handleUpdateSelectedSimpleDataset = (updatedDataset: LocalDataset) => {
     setSimpleDatasets(prev => prev.map(ds => ds.id === selectedSimpleDatasetId ? updatedDataset : ds));
  };
  
  const selectedSimpleDataset = simpleDatasets.find(ds => ds.id === selectedSimpleDatasetId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b bg-slate-50">
          <DialogTitle>Data Management</DialogTitle>
          <DialogDescription>Create and manage datasets for this form template.</DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 bg-slate-50 px-4">
                <TabsTrigger value="simple">Simple Datasets</TabsTrigger>
                <TabsTrigger value="advanced">Advanced Datasets (Relational)</TabsTrigger>
            </TabsList>
            <TabsContent value="simple" className="flex-1 flex flex-row overflow-hidden bg-slate-50 m-0">
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
                        <LocalDatasetEditor dataset={selectedSimpleDataset} onUpdate={handleUpdateSelectedSimpleDataset} />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                            <TableIcon className="h-12 w-12 mb-4" />
                            <h3 className="text-lg font-semibold">No Dataset Selected</h3>
                            <p className="text-sm">Select a dataset from the left panel or create a new one.</p>
                        </div>
                    )}
                </main>
            </TabsContent>
            <TabsContent value="advanced" className="flex-1 flex flex-row overflow-hidden bg-slate-50 m-0">
                <AdvancedDatasetsTab datasets={localAdvancedDatasets} setDatasets={setLocalAdvancedDatasets} />
            </TabsContent>
        </Tabs>

        <DialogFooter className="p-4 border-t bg-slate-50">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
