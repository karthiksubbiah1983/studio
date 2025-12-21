'use client';

import { FormElementInstance, TableColumn } from '@/lib/types';
import { useBuilder } from '@/hooks/use-builder';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FormElementRenderer } from '@/components/form-element';
import { Plus, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';

type Props = {
  element: FormElementInstance;
  value: any[];
  onValueChange: (id: string, value: any) => void;
};

export function EditableTable({ element, value, onValueChange }: Props) {
  const { formState } = useBuilder();
  const rows = Array.isArray(value) ? value : [];

  const handleRowValueChange = (rowIndex: number, columnId: string, cellValue: any, fullObject?: any) => {
    const newRows = [...rows];
    const newRow = { ...newRows[rowIndex], [columnId]: cellValue };

    // Find the element definition for the changed column
    const changedColumnElement = element.columns?.find(c => c.id === columnId)?.element;

    if (changedColumnElement?.type === 'Select' && changedColumnElement.dataSource === 'dynamic') {
        newRows[rowIndex] = { ...newRow, [`${columnId}__fullObject`]: fullObject };
    } else {
        newRows[rowIndex] = newRow;
    }

    onValueChange(element.id, newRows);
  };

  const addRow = () => {
    const newRow: Record<string, any> = {};
    element.columns?.forEach(col => {
        newRow[col.id] = col.element.defaultValue ?? '';
    });
    onValueChange(element.id, [...rows, newRow]);
  };

  const removeRow = (index: number) => {
    onValueChange(element.id, rows.filter((_, i) => i !== index));
  };

  return (
    <div className='flex flex-col gap-4'>
        <label className='text-sm font-medium'>{element.label}</label>
        <ScrollArea>
            <Table>
                <TableHeader>
                <TableRow>
                    {element.columns?.map(col => (
                    <TableHead key={col.id}>{col.label}</TableHead>
                    ))}
                    <TableHead className='w-[50px]'></TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                    {element.columns?.map(col => {
                        // Create a specific row context for rule evaluation
                        const rowContext = {
                            ...formState,
                            ...row
                        };

                        return (
                            <TableCell key={col.id} className="min-w-[200px]">
                                <FormElementRenderer
                                    element={col.element}
                                    value={row[col.id]}
                                    onValueChange={(id, val, fullObj) => handleRowValueChange(rowIndex, col.id, val, fullObj)}
                                    formState={rowContext}
                                    isTableCell={true}
                                />
                            </TableCell>
                        )
                    })}
                    <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeRow(rowIndex)}>
                        <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <Button variant="outline" onClick={addRow} className='w-full'>
            <Plus className="mr-2 h-4 w-4" />
            Add Row
        </Button>
    </div>
  );
}
