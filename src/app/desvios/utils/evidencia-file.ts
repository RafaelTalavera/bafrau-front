export const EVIDENCIA_ACCEPT = [
  'image/jpeg', 'image/png', 'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel', 'text/csv',
  '.jpg', '.jpeg', '.png', '.webp', '.pdf', '.docx', '.xlsx', '.xls', '.csv'
].join(',');

const IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const DOCUMENT_TYPES: Record<string, Set<string>> = {
  pdf: new Set(['application/pdf']),
  docx: new Set(['application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  xlsx: new Set(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  xls: new Set(['application/vnd.ms-excel']),
  csv: new Set(['text/csv', 'application/csv', 'text/plain'])
};

export function validateEvidenceFile(file: File): string | undefined {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const type = file.type.toLowerCase();
  if (IMAGE_TYPES.has(type) && ['jpg', 'jpeg', 'png', 'webp'].includes(extension))
    return file.size > 10 * 1024 * 1024 ? 'las imágenes no pueden superar 10 MB.' : undefined;
  const allowedTypes = DOCUMENT_TYPES[extension];
  if (!allowedTypes || !allowedTypes.has(type))
    return 'formato no permitido. Admitidos: JPG, PNG, WebP, PDF, DOCX, XLSX, XLS o CSV.';
  return file.size > 25 * 1024 * 1024 ? 'los documentos no pueden superar 25 MB.' : undefined;
}

export function isImageEvidence(type: string | undefined): boolean {
  return !!type && IMAGE_TYPES.has(type.toLowerCase());
}

export function fileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
