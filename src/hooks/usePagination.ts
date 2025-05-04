
import { useState, useEffect } from 'react';

interface PaginationOptions {
  initialPage?: number;
  pageSize?: number;
}

interface PaginationResult<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  paginatedData: T[];
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
}

export function usePagination<T>(
  data: T[] | undefined | null,
  options: PaginationOptions = {}
): PaginationResult<T> {
  const { initialPage = 1, pageSize: initialPageSize = 10 } = options;
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Reset to page 1 when data or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, data?.length]);

  // Calculate total items and pages
  const totalItems = data?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Ensure current page is valid
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Get data for current page
  const paginatedData = data
    ? data.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : [];

  // Navigation functions
  const goToPage = (page: number) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
    // Scroll to top of the list when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    // Reset to page 1 when changing page size is handled by the useEffect
  };

  return {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
    setPageSize: changePageSize
  };
}
