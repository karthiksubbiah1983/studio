

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
import { Card, CardContent, CardFooter } from '../ui/card';
import { Label } from '../ui/label';

type Props = {
  element: FormElementInstance;
  value: any[];
  onValueChange: (id: string, value: any) => void;
};

export function EditableTable({ element, value, onValueChange }: Props) {
  const { sections } = useBuilder();
  const [searchTerm, setSearchTerm] = useState('');
  const [activePopupPreview, setActivePopupPreview] = useState<{ rowId: string, sections: any[] } | null>(null);
  const [activeInlinePreview, setActiveInlinePreview] = useState<{ rowId: string, sections: any[] } | null>(null);

  const rows = Array.isArray(value) ? value : [];

  const handleRowChange = (rowIndex: number, columnId: string, cellValue: any, fullObject?: any) => {
    const column = element.columns?.find(c => c.element.id === columnId);
    if (!column || !column.element.key) return;

    // Find the original index from the unfiltered `rows` array based on the `_rowId` of the row from the `filteredRows` array.
    const originalRow = rows.find(r => r._rowId === filteredRows[rowIndex]._rowId);
    if (!originalRow) return;
    const originalRowIndex = rows.indexOf(originalRow);
    
    if (originalRowIndex !== -1) {
        const newRows = [...rows];
        const updatedRow = { ...newRows[originalRowIndex], [column.element.key]: cellValue };
        if (fullObject) {
            updatedRow[`${column.element.key}__fullObject`] = fullObject;
        }
        newRows[originalRowIndex] = updatedRow;
        onValueChange(element.id, newRows);
    }
  };

  const addRow = () => {
    if (element.maxRows && rows.length >= element.maxRows) return;
    
    const newRow: Record<string, any> = { _rowId: crypto.randomUUID(), _previewData: {} };
    element.columns?.forEach(col => {
      if (col.element.key) {
        newRow[col.element.key] = col.element.defaultValue ?? '';
      }
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

    if (elementInColumn.displayMode === 'inline') {
      setActiveInlinePreview(prev => prev?.rowId === rowId ? null : { rowId, sections: sectionsToPreview });
      setActivePopupPreview(null);
    } else { // popup mode is default
      setActivePopupPreview({ rowId, sections: sectionsToPreview });
      setActiveInlinePreview(null);
    }
  };

  const handleSavePreview = (rowId: string) => (newPreviewState: any) => {
    const newRows = rows.map(row => {
        if (row._rowId === rowId) {
            return { ...row, _previewData: newPreviewState };
        }
        return row;
    });
    onValueChange(element.id, newRows);
    setActivePopupPreview(null);
    setActiveInlinePreview(null);
  };
  
  const currentRowForPopupPreview = activePopupPreview ? rows.find(r => r._rowId === activePopupPreview.rowId) : null;
  const isAnyColumnPopup = element.columns?.some(c => c.element.type === 'Preview' && c.element.displayMode !== 'inline');
  
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

        {/* Desktop Table View */}
        <div className="hidden md:block">
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
                    {filteredRows.map((row, rowIndex) => {
                    const isInlinePreviewOpen = activeInlinePreview?.rowId === row._rowId;
                    
                    return (
                        <React.Fragment key={row._rowId}>
                        <TableRow>
                            {element.columns?.map(col => {
                                const cellValue = col.element.key ? row[col.element.key] : undefined;
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
                        {isInlinePreviewOpen && activeInlinePreview && (
                            <TableRow>
                            <TableCell colSpan={(element.columns?.length || 0) + 1}>
                                <div className="p-4 border rounded-md bg-accent/20">
                                <FormPreview 
                                    sections={activeInlinePreview.sections} 
                                    showSubmitButton={true}
                                    initialState={row._previewData}
                                    onSubmit={handleSavePreview(row._rowId)}
                                    submitButtonText="Save Checklist"
                                />
                                </div>
                            </TableCell>
                            </TableRow>
                        )}
                        </React.Fragment>
                    )
                    })}
                    </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden space-y-4">
            {filteredRows.map((row, rowIndex) => {
                 const isInlinePreviewOpen = activeInlinePreview?.rowId === row._rowId;
                 return (
                    <Card key={row._rowId} className="border-l-4 border-primary">
                        <CardContent className="p-4 space-y-4">
                        {element.columns?.map(col => {
                            const cellValue = col.element.key ? row[col.element.key] : undefined;
                            const rowContext = { ...row };

                            return (
                            <div key={col.id} className="space-y-2">
                                <Label>{col.label}</Label>
                                {col.element.type === 'Preview' ? (
                                <Button variant="outline" className="w-full" onClick={() => handleOpenPreview(row._rowId, col.element)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    {col.element.label}
                                </Button>
                                ) : (
                                <FormElementRenderer
                                    element={col.element}
                                    value={cellValue}
                                    onValueChange={(id, val, fullObj) => handleRowChange(rowIndex, col.element.id, val, fullObj)}
                                    rowContext={rowContext}
                                    isTableCell={true}
                                />
                                )}
                            </div>
                            );
                        })}
                        </CardContent>
                        <CardFooter className="p-4 pt-0 flex justify-end">
                        <Button variant="ghost" size="icon" onClick={() => removeRow(row._rowId)}>
                            <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                        </CardFooter>
                        {isInlinePreviewOpen && activeInlinePreview && (
                        <div className="p-4 border-t">
                            <FormPreview 
                            sections={activeInlinePreview.sections} 
                            showSubmitButton={true}
                            initialState={row._previewData}
                            onSubmit={handleSavePreview(row._rowId)}
                            submitButtonText="Save Checklist"
                            />
                        </div>
                        )}
                    </Card>
                 )
            })}
        </div>

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
        
        {isAnyColumnPopup && activePopupPreview && (
             <Dialog open={!!activePopupPreview} onOpenChange={(isOpen) => !isOpen && setActivePopupPreview(null)}>
                <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
                    <DialogHeader className="p-4 border-b">
                        <DialogTitle>Checklist</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="flex-1">
                        <div className="p-4">
                        <FormPreview 
                            sections={activePopupPreview.sections} 
                            showSubmitButton={true}
                            initialState={currentRowForPopupPreview?._previewData}
                            onSubmit={handleSavePreview(activePopupPreview.rowId)}
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
