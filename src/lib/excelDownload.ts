import * as XLSX from 'xlsx';
import { downloadBlob } from '@/lib/downloadFile';

const EXCEL_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export function downloadWorkbook(workbook: XLSX.WorkBook, fileName: string): void {
  const output = XLSX.write(workbook, {
    bookSST: true,
    bookType: 'xlsx',
    compression: true,
    type: 'array',
  });

  downloadBlob(
    new Blob([output], { type: EXCEL_MIME_TYPE }),
    fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`
  );
}