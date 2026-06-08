import { useEffect, useMemo, useState } from 'react'

export function usePagination<T>(items: T[], initialPageSize = 20) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  // Reseta para a primeira página quando a lista filtrada muda de tamanho
  useEffect(() => {
    setPage(1)
  }, [totalItems])

  // Evita ficar em uma página vazia ao reduzir o pageSize
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    paginatedItems,
    setPage,
    setPageSize: (size: number) => {
      setPageSize(size)
      setPage(1)
    },
  }
}
