

'use client';

import { FormElementInstance } from '@/lib/types';
import { useBuilder } from '@/hooks/use-builder';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FormElementRenderer } from '@/components/form-element';
import { Plus, Trash, Search, Eye } from 'lucide-react';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { FormPreview } from '../form-preview';

type Props = {
  element: FormElementInstance;
  value: any[];
  onValueChange: (id: string, value: any) => void;
};

export function EditableTable({ element, value, onValueChange }: Props) {
  const { sections } = useBuilder();
  const [searchTerm, setSearchTerm] = useState('');
  const [activePreviewRow, setActivePreviewRow] = useState<{ rowId: string, sections: any[] } | null>(null);

  const rows = Array.isArray(value) ? value : [];

  const handleRowChange = (rowIndex: number, columnId: string, cellValue: any, fullObject?: any) => {
    const newRows = [...rows];
    const originalRowIndex = rows.findIndex(r => r._rowId === filteredRows[rowIndex]._rowId);
    
    if (originalRowIndex !== -1) {
        const updatedRow = { ...newRows[originalRowIndex], [columnId]: cellValue };
        if (fullObject) {
            updatedRow[`${columnId}__fullObject`] = fullObject;
        }
        newRows[originalRowIndex] = updatedRow;
        onValueChange(element.id, newRows);
    }
  };

  const addRow = () => {
    if (element.maxRows && rows.length >= element.maxRows) return;
    
    const newRow: Record<string, any> = { _rowId: crypto.randomUUID(), _previewData: {} };
    element.columns?.forEach(col => {
      newRow[col.element.id] = col.element.defaultValue ?? '';
    });

    onValueChange(element.id, [...rows, newRow]);
  };
  
  const removeRow = (rowId: string) => {
    const newRows = rows.filter(row => row._rowId !== rowId);
    onValueChange(element.id, newRows);
  };
  
  let filteredRows = [...rows];
  if (element.enableSearch && searchTerm) {
    filteredRows = filteredRows.filter(row => {
      return Object.values(row).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }

  const handleOpenPreview = (rowId: string, elementInColumn: FormElementInstance) => {
    if (elementInColumn.type !== 'Preview' || !elementInColumn.previewSectionIds) return;
    const sectionsToPreview = sections.filter(s => elementInColumn.previewSectionIds?.includes(s.id));
    setActivePreviewRow({ rowId, sections: sectionsToPreview });
  };

  const handleSavePreview = (newPreviewState: any) => {
    if (!activePreviewRow) return;
    const newRows = rows.map(row => {
        if (row._rowId === activePreviewRow.rowId) {
            return { ...row, _previewData: newPreviewState };
        }
        return row;
    });
    onValueChange(element.id, newRows);
    setActivePreviewRow(null);
  };
  
  const currentRowForPreview = activePreviewRow ? rows.find(r => r._rowId === activePreviewRow.rowId) : null;
  const isPopupPreview = element.columns?.some(c => c.element.type === 'Preview' && c.element.displayMode !== 'inline');
  
  return (
    <div className='flex flex-col gap-4'>
        <label className='text-sm font-medium'>{element.label}</label>

        {element.enableSearch && (
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search rows..."
                    className="pl-8 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        )}

        <ScrollArea>
            <Table>
                <TableHeader>
                <TableRow>
                    {element.columns?.map(col => (
                    <TableHead key={col.id}>
                        {col.label}
                    </TableHead>
                    ))}
                    <TableHead className='w-[50px]'></TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredRows.map((row, rowIndex) => (
                    <TableRow key={row._rowId}>
                    {element.columns?.map(col => {
                        const cellState = row[col.element.id];
                        const cellValue = (cellState && typeof cellState === 'object' && 'value' in cellState) ? cellState.value : cellState;
                        const rowContext = { ...row };

                        if (col.element.type === 'Preview') {
                            return (
                                <TableCell key={col.id} className="min-w-[200px]">
                                    <Button variant="outline" className="w-full" onClick={() => handleOpenPreview(row._rowId, col.element)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        {col.element.label}
                                    </Button>
                                </TableCell>
                            )
                        }

                        return (
                            <TableCell key={col.id} className="min-w-[200px]">
                                <FormElementRenderer
                                    element={col.element}
                                    value={cellValue}
                                    onValueChange={(id, val, fullObj) => handleRowChange(rowIndex, col.element.id, val, fullObj)}
                                    rowContext={rowContext}
                                    isTableCell={true}
                                />
                            </TableCell>
                        )
                    })}
                    <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeRow(row._rowId)}>
                            <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <div className="flex items-center justify-between">
             {element.allowUserToAddRows && (
                <Button 
                    variant="outline" 
                    onClick={addRow} 
                    className='w-fit'
                    disabled={element.maxRows !== undefined && rows.length >= element.maxRows}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Row
                </Button>
             )}
        </div>
        
        {isPopupPreview && activePreviewRow && (
             <Dialog open={!!activePreviewRow} onOpenChange={(isOpen) => !isOpen && setActivePreviewRow(null)}>
                <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
                    <DialogHeader className="p-4 border-b">
                        <DialogTitle>Checklist</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="flex-1">
                        <div className="p-4">
                        <FormPreview 
                            sections={activePreviewRow.sections} 
                            showSubmitButton={true}
                            initialState={currentRowForPreview?._previewData}
                            onSubmit={handleSavePreview}
                            submitButtonText="Save Checklist"
                        />
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        )}
    </div>
  );
}
