
import React from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100]
}: PaginationProps) {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const startItem = totalItems 
    ? Math.min(((currentPage - 1) * pageSize) + 1, totalItems)
    : (currentPage - 1) * pageSize + 1;
    
  const endItem = totalItems 
    ? Math.min(startItem + pageSize - 1, totalItems) 
    : currentPage * pageSize;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 py-4 bg-white/10 rounded-lg p-4 border border-white/20 backdrop-blur-sm">
      <div className="flex-1 text-sm text-white">
        {totalItems ? (
          <p>
            Mostrando <span className="font-medium text-white">{startItem}</span> até{" "}
            <span className="font-medium text-white">{endItem}</span> de{" "}
            <span className="font-medium text-white">{totalItems}</span> itens
          </p>
        ) : (
          <p>
            Página <span className="font-medium text-white">{currentPage}</span> de{" "}
            <span className="font-medium text-white">{totalPages}</span>
          </p>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        {onPageSizeChange && (
          <div className="flex items-center space-x-2">
            <p className="text-sm text-white">Itens por página</p>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px] bg-white/10 border-white/20 text-white">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={!canGoPrevious}
          className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoNext}
          className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
