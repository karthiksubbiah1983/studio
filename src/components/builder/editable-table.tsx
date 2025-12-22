

'use client';

import { FormElementInstance } from '@/lib/types';
import { useBuilder } from '@/hooks/use-builder';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FormElementRenderer } from '@/components/form-element';
import { Plus, Trash, Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import React, { useState, useMemo, useCallback } from 'react';
import { Input } from '../ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';

type Props = {
  element: FormElementInstance;
  value: any[];
  onValueChange: (id: string, value: any) => void;
  formState?: { [key: string]: any };
};

export function EditableTable({ element, value, onValueChange }: Props) {
  const { formState, updateFormState } = useBuilder();
  const [searchTerm, setSearchTerm] = useState('');
  
  const rows = Array.isArray(value) ? value : [];

  const handleRowChange = (rowIndex: number, columnId: string, cellValue: any, fullObject?: any) => {
    const originalRowId = filteredRows[rowIndex]?._rowId;
    if (!originalRowId) return;

    const newRows = rows.map(row => {
        if (row._rowId === originalRowId) {
            const updatedRow = { ...row, [columnId]: cellValue };
            if (fullObject) {
                updatedRow[`${columnId}__fullObject`] = fullObject;
            }
            return updatedRow;
        }
        return row;
    });
    
    onValueChange(element.id, newRows);
  };


  const addRow = () => {
    if (element.maxRows && rows.length >= element.maxRows) return;
    const newRow: Record<string, any> = { _rowId: crypto.randomUUID() };
    element.columns?.forEach(col => {
      newRow[col.element.id] = col.element.defaultValue ?? '';
    });
    onValueChange(element.id, [...rows, newRow]);
  };

  const removeRow = (rowId: string) => {
    onValueChange(element.id, rows.filter(row => row._rowId !== rowId));
  };
  
  const filteredRows = useMemo(() => {
    let searchableItems = [...rows];

    // Filtering
    if (element.enableSearch && searchTerm) {
      searchableItems = searchableItems.filter(row => {
        return Object.values(row).some(val => 
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    return searchableItems;
  }, [rows, searchTerm, element.enableSearch]);

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
                        return (
                            <TableCell key={col.id} className="min-w-[200px]">
                                <FormElementRenderer
                                    element={col.element}
                                    value={row[col.element.id]}
                                    onValueChange={(id, val, fullObj) => handleRowChange(rowIndex, col.element.id, val, fullObj)}
                                    formState={formState} // Pass global state for external dependencies
                                    rowContext={row} // Pass row-specific data
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
             <Button 
                variant="outline" 
                onClick={addRow} 
                className='w-fit'
                disabled={element.maxRows !== undefined && rows.length >= element.maxRows}
             >
                <Plus className="mr-2 h-4 w-4" />
                Add Row
            </Button>
        </div>
    </div>
  );
}
