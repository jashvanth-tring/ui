import * as XLSX from 'xlsx';

export interface ExportColumn<T = any> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

export interface ExportOptions<T = any> {
  filename: string;
  sheetName?: string;
  columns: ExportColumn<T>[];
  data: T[];
}

export function exportToXlsx<T>({
  filename,
  sheetName = 'Sheet1',
  columns,
  data,
}: ExportOptions<T>): void {
  if (!data || data.length === 0) return;

  const rows = data.map((row) => {
    const obj: Record<string, string | number | null | undefined> = {};
    columns.forEach((col) => {
      const val = col.accessor(row);
      obj[col.header] = val ?? '-';
    });
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-width columns
  ws['!cols'] = columns.map((col) => ({
    wch: Math.max(
      col.header.length,
      ...rows.map((row) => String(row[col.header] ?? '').length)
    ),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}