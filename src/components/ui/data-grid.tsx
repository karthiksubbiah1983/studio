
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
import { Skeleton } from "./skeleton";

type DataGridProps = {
  apiUrl: string;
  columns: DataGridColumn[];
};

export function DataGrid({
  apiUrl,
  columns,
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
  
  const visibleColumns = columns.filter(c => c.visible);

  const renderLoadingState = () => (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-2">
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
            {visibleColumns.map(col => (
              <TableHead key={col.id}>{col.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => {
            return (
              <TableRow
                key={rowIndex}
              >
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
