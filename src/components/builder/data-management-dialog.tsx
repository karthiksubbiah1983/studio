
'use client';

import { useState, useEffect, memo } from 'react';
import { useBuilder } from '@/hooks/use-builder';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Dataset, DatasetColumn } from '@/lib/types';
import { Plus, Trash, Copy, Edit, Table as TableIcon } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/table';

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const DatasetEditor = memo(({ dataset, onUpdate }: { dataset: Dataset, onUpdate: (updated: Dataset) => void }) => {

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...dataset, name: e.target.value });
  };
  
  // Column Handlers
  const handleAddColumn = () => {
    const newColumn: DatasetColumn = {
        id: crypto.randomUUID(),
        header: `Column ${dataset.columns.length + 1}`,
        key: `column_${dataset.columns.length + 1}`.toLowerCase()
    };
    onUpdate({ ...dataset, columns: [...dataset.columns, newColumn] });
  };
  
  const handleUpdateColumn = (colId: string, field: 'header' | 'key', value: string) => {
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
        acc[col.key] = '';
        return acc;
    }, {} as Record<string, any>);
    onUpdate({ ...dataset, data: [...dataset.data, newRow] });
  };

  const handleUpdateCell = (rowIndex: number, colKey: string, value: string) => {
    const newData = [...dataset.data];
    newData[rowIndex] = { ...newData[rowIndex], [colKey]: value };
    onUpdate({ ...dataset, data: newData });
  };
  
  const handleDeleteRow = (rowIndex: number) => {
    const newData = dataset.data.filter((_, i) => i !== rowIndex);
    onUpdate({ ...dataset, data: newData });
  };

  return (
    <ScrollArea className="h-full">
        <div className="p-6 space-y-6">
            <div>
                <Label htmlFor="dataset-name">Dataset Name</Label>
                <Input id="dataset-name" value={dataset.name} onChange={handleNameChange} className="mt-1 bg-white font-medium text-lg" />
            </div>
            
            <div className="space-y-2">
                <h3 className="font-semibold text-primary">Columns</h3>
                 <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-1/2">Header</TableHead>
                                <TableHead className="w-1/2">Key</TableHead>
                                <TableHead className="w-10"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dataset.columns.map(col => (
                                <TableRow key={col.id}>
                                    <TableCell>
                                        <Input defaultValue={col.header} onBlur={(e) => handleUpdateColumn(col.id, 'header', e.target.value)} className="h-8"/>
                                    </TableCell>
                                    <TableCell>
                                        <Input defaultValue={col.key} onBlur={(e) => handleUpdateColumn(col.id, 'key', e.target.value.replace(/\s+/g, '_').toLowerCase())} className="h-8"/>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteColumn(col.id)}>
                                            <Trash className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="p-2 border-t">
                        <Button variant="outline" size="sm" onClick={handleAddColumn} className="w-full">
                            <Plus className="mr-2 h-4 w-4" /> Add Column
                        </Button>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                 <h3 className="font-semibold text-primary">Data</h3>
                <div className="border rounded-md">
                     <ScrollArea className="max-h-96">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {dataset.columns.map(col => <TableHead key={col.id}>{col.header}</TableHead>)}
                                    <TableHead className="w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dataset.data.map((row, rowIndex) => (
                                    <TableRow key={rowIndex}>
                                        {dataset.columns.map(col => (
                                            <TableCell key={col.id}>
                                                <Input
                                                    defaultValue={row[col.key] || ''}
                                                    onBlur={(e) => handleUpdateCell(rowIndex, col.key, e.target.value)}
                                                    className="h-8"
                                                />
                                            </TableCell>
                                        ))}
                                        <TableCell>
                                             <Button variant="ghost" size="icon" onClick={() => handleDeleteRow(rowIndex)}>
                                                <Trash className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     </ScrollArea>
                    <div className="p-2 border-t">
                         <Button variant="outline" size="sm" onClick={handleAddRow} className="w-full">
                            <Plus className="mr-2 h-4 w-4" /> Add Row
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </ScrollArea>
  );
});
DatasetEditor.displayName = "DatasetEditor";

export function DataManagementDialog({ isOpen, onOpenChange }: Props) {
  const { datasets, updateDatasets } = useBuilder();
  const [localDatasets, setLocalDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const initialDatasets = JSON.parse(JSON.stringify(datasets || []));
      setLocalDatasets(initialDatasets);
      if (initialDatasets.length > 0 && !initialDatasets.some((d: Dataset) => d.id === selectedDatasetId)) {
        setSelectedDatasetId(initialDatasets[0].id);
      } else if (initialDatasets.length === 0) {
        setSelectedDatasetId(null);
      }
    }
  }, [isOpen, datasets, selectedDatasetId]);

  const handleSaveChanges = () => {
    updateDatasets(localDatasets);
    onOpenChange(false);
  };

  const handleAddDataset = () => {
    const newDataset: Dataset = {
        id: crypto.randomUUID(),
        name: `Dataset ${localDatasets.length + 1}`,
        columns: [{id: crypto.randomUUID(), header: 'Column 1', key: 'column_1'}],
        data: []
    };
    setLocalDatasets([...localDatasets, newDataset]);
    setSelectedDatasetId(newDataset.id);
  };

  const handleSelectDataset = (id: string) => {
    setSelectedDatasetId(id);
  };

  const handleDeleteDataset = (id: string) => {
    setLocalDatasets(prev => prev.filter(ds => ds.id !== id));
    if (selectedDatasetId === id) {
        setSelectedDatasetId(localDatasets.length > 1 ? localDatasets[0].id : null);
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
            <aside className="w-1/3 border-r flex flex-col bg-white">
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
