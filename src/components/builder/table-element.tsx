
"use client";

import { useEffect, useMemo, useState } from "react";
import { FormElementInstance, TableColumn } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Plus, Search, Trash } from "lucide-react";
import { FormElementRenderer } from "../form-element";
import { cn, getNestedValue } from "@/lib/utils";
import { evaluate } from "@/lib/formula-parser";
import { useBuilder } from "@/hooks/use-builder";
import { fetchFromApi } from "@/services/api";
import { findFirstArray } from "@/lib/utils";

type TableElementProps = {
  element: FormElementInstance;
  value: any[] | undefined;
  onValueChange: (id: string, value: any) => void;
  isParentHorizontal?: boolean;
};

export function TableElement({ element, value: tableRows = [], onValueChange }: TableElementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { formState } = useBuilder();

  const tableColumns = useMemo(() => element.tableColumns || [], [element.tableColumns]);
  const pageSize = element.pageSize || 5;

  // Effect to fetch initial data for dynamic tables
  useEffect(() => {
    if (element.dataSource === 'dynamic' && element.apiUrl) {
      setIsLoading(true);
      fetchFromApi(element.apiUrl)
        .then(data => {
          const arrayData = findFirstArray(data);
          if (arrayData) {
            onValueChange(element.id, arrayData);
          }
        })
        .finally(() => setIsLoading(false));
    } else if (element.dataSource !== 'dynamic' && !tableRows && element.defaultRows) {
      const initialData = Array(element.defaultRows).fill({}).map(() => ({}));
      onValueChange(element.id, initialData);
    }
  }, [element.dataSource, element.apiUrl, element.defaultRows, onValueChange, element.id]);


  const handleRowValueChange = (rowIndex: number, columnKey: string, cellValue: any) => {
    const newRows = [...(tableRows || [])];
    if (!newRows[rowIndex]) newRows[rowIndex] = {};
    newRows[rowIndex][columnKey] = cellValue;

    // Recalculate formula columns for the changed row
    tableColumns.forEach(col => {
      if (col.formula) {
        try {
          const formulaResult = evaluate(col.formula, newRows[rowIndex]);
          newRows[rowIndex][col.key] = formulaResult;
        } catch (e) {
          console.error(`Error evaluating formula for column ${col.key}:`, e);
          newRows[rowIndex][col.key] = "#ERROR!";
        }
      }
    });

    onValueChange(element.id, newRows);
  };

  const handleAddRow = () => {
    if (element.maxRows && (tableRows || []).length >= element.maxRows) return;
    const newRows = [...(tableRows || []), {}];
    onValueChange(element.id, newRows);
  };

  const handleDeleteRow = (rowIndex: number) => {
    const newRows = (tableRows || []).filter((_, i) => i !== rowIndex);
    onValueChange(element.id, newRows);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return tableRows || [];
    return (tableRows || []).filter(row =>
      Object.values(row).some(cellValue =>
        String(cellValue).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [tableRows, searchTerm]);

  const totalPages = element.paginationEnabled ? Math.ceil(filteredData.length / pageSize) : 1;
  const paginatedData = element.paginationEnabled ? filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize) : filteredData;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const isAddRowDisabled = !!element.maxRows && (tableRows || []).length >= element.maxRows;
  
  return (
    <div>
      <Label className="text-[0.9rem] mb-2">{element.label}</Label>
      {element.enableSearch && (
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      )}

      {/* Desktop Table */}
      <div className="rounded-md border hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {tableColumns.map(col => <TableHead key={col.id}>{col.label}</TableHead>)}
              {element.canAddRows && element.dataSource !== 'dynamic' && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, paginatedIndex) => {
              const originalIndex = filteredData.indexOf(row);
              return (
                <TableRow key={originalIndex}>
                  {tableColumns.map(col => {
                    const proxyId = `${element.id}::${col.key}::${originalIndex}`;
                    const cellValue = getNestedValue(row, col.key);

                    if (col.formula) {
                      return <TableCell key={proxyId}><Input readOnly value={cellValue} className="border-none bg-transparent" /></TableCell>;
                    }

                    return (
                      <TableCell key={proxyId}>
                        <FormElementRenderer
                          element={{ ...col.element, id: proxyId, key: col.key }}
                          value={cellValue}
                          onValueChange={(_id, val) => handleRowValueChange(originalIndex, col.key, val)}
                          formState={{ ...formState, ...row }} // Provide full context for rules
                          rowContext={row}
                          isTableCell={true}
                        />
                      </TableCell>
                    );
                  })}
                  {element.canAddRows && element.dataSource !== 'dynamic' && (
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteRow(originalIndex)}>
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {paginatedData.map((row, paginatedIndex) => {
          const originalIndex = filteredData.indexOf(row);
          return (
            <div key={originalIndex} className="border rounded-lg p-4 space-y-4">
              {tableColumns.map(col => {
                const proxyId = `${element.id}::${col.key}::${originalIndex}`;
                const cellValue = getNestedValue(row, col.key);

                return (
                  <div key={proxyId} className="space-y-1">
                    <Label className="text-muted-foreground">{col.label}</Label>
                    {col.formula ? (
                      <Input readOnly value={cellValue} className="border-none bg-transparent p-0 h-auto" />
                    ) : (
                      <FormElementRenderer
                        element={{ ...col.element, id: proxyId, key: col.key }}
                        value={cellValue}
                        onValueChange={(_id, val) => handleRowValueChange(originalIndex, col.key, val)}
                        formState={{ ...formState, ...row }}
                        rowContext={row}
                        isTableCell={true}
                      />
                    )}
                  </div>
                );
              })}
              {element.canAddRows && element.dataSource !== 'dynamic' && (
                <div className="pt-2 border-t">
                  <Button variant="ghost" size="sm" className="w-full justify-center text-destructive" onClick={() => handleDeleteRow(originalIndex)}>
                    <Trash className="h-4 w-4 mr-2" />
                    Delete Row
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {element.canAddRows && element.dataSource !== 'dynamic' && (
        <Button variant="outline" size="sm" className="mt-4 w-full md:w-auto" onClick={handleAddRow} disabled={isAddRowDisabled}>
          <Plus className="h-4 w-4 mr-2" />
          Add Row
        </Button>
      )}
      
      {element.paginationEnabled && totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
