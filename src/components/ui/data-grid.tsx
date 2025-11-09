
"use client";

import { useEffect, useState } from "react";
import { DataGridColumn } from "@/lib/types";
import { fetchFromApi } from "@/services/api";
import { cn, findFirstArray, getNestedValue } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "./checkbox";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Skeleton } from "./skeleton";

type DataGridProps = {
  apiUrl: string;
  columns: DataGridColumn[];
  selectionMode?: 'single' | 'multiple' | 'none';
  onSelectionChange?: (selected: any[] | any | null) => void;
  value?: any; // The current selected value(s)
};

export function DataGrid({
  apiUrl,
  columns,
  selectionMode = 'none',
  onSelectionChange,
  value,
}: DataGridProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiUrl) {
      setIsLoading(false);
      setError("API URL is not configured.");
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchFromApi(apiUrl);
        const arrayData = findFirstArray(result);
        if (arrayData) {
          setData(arrayData);
        } else {
          setError("No array found in the API response.");
          setData([]);
        }
      } catch (err) {
        setError("Failed to fetch data.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [apiUrl]);
  
  const handleSingleSelect = (row: any) => {
    onSelectionChange?.(row);
  };

  const handleMultiSelect = (row: any) => {
    const currentValue = Array.isArray(value) ? value : [];
    const isSelected = currentValue.some(item => JSON.stringify(item) === JSON.stringify(row));
    let newSelection;
    if (isSelected) {
      newSelection = currentValue.filter(item => JSON.stringify(item) !== JSON.stringify(row));
    } else {
      newSelection = [...currentValue, row];
    }
    onSelectionChange?.(newSelection);
  };

  const visibleColumns = columns.filter(c => c.visible);

  const renderLoadingState = () => (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-2">
          {selectionMode !== 'none' && <Skeleton className="h-8 w-8" />}
          {visibleColumns.map(col => <Skeleton key={col.id} className="h-8 flex-1" />)}
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return renderLoadingState();
  }

  if (error) {
    return <div className="text-destructive text-sm">{error}</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {selectionMode !== 'none' && <TableHead className="w-[50px]"></TableHead>}
            {visibleColumns.map(col => (
              <TableHead key={col.id}>{col.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => {
            const isSingleSelected = selectionMode === 'single' && JSON.stringify(value) === JSON.stringify(row);
            const isMultiSelected = selectionMode === 'multiple' && Array.isArray(value) && value.some(item => JSON.stringify(item) === JSON.stringify(row));
            
            return (
              <TableRow
                key={rowIndex}
                className={cn((isSingleSelected || isMultiSelected) && 'bg-accent')}
                onClick={() => {
                  if (selectionMode === 'single') handleSingleSelect(row);
                  if (selectionMode === 'multiple') handleMultiSelect(row);
                }}
              >
                {selectionMode === 'single' && (
                  <TableCell>
                     <RadioGroup value={isSingleSelected ? "selected" : ""}>
                        <RadioGroupItem value="selected" />
                     </RadioGroup>
                  </TableCell>
                )}
                {selectionMode === 'multiple' && (
                  <TableCell>
                    <Checkbox checked={isMultiSelected} />
                  </TableCell>
                )}
                 {selectionMode === 'none' && selectionMode !== 'single' && selectionMode !== 'multiple' && null}

                {visibleColumns.map(col => (
                  <TableCell key={col.id}>{getNestedValue(row, col.key)}</TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  );
}
