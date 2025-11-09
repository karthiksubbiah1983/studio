
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
import { Button } from "./button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type DataGridProps = {
  apiUrl: string;
  columns: DataGridColumn[];
  paginationEnabled?: boolean;
  pageSize?: number;
};

export function DataGrid({
  apiUrl,
  columns,
  paginationEnabled,
  pageSize = 5,
}: DataGridProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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

  const totalPages = paginationEnabled ? Math.ceil(data.length / pageSize) : 1;
  const paginatedData = paginationEnabled ? data.slice((currentPage - 1) * pageSize, currentPage * pageSize) : data;

  const handlePrevPage = () => {
    setCurrentPage(p => Math.max(1, p - 1));
  }
  const handleNextPage = () => {
    setCurrentPage(p => Math.min(totalPages, p + 1));
  }


  const renderLoadingState = () => (
    <div className="space-y-2">
      {[...Array(pageSize)].map((_, i) => (
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
    <div>
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
            {paginatedData.map((row, rowIndex) => {
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
        {paginationEnabled && totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
                 <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        )}
    </div>
  );
}
