
import { Paper } from '../types';

function escapeCSVField(field: string | undefined | null): string {
  if (field === undefined || field === null) {
    return '';
  }
  const stringField = String(field);
  // If the field contains a comma, newline, or double quote, enclose it in double quotes.
  // Also, double up any existing double quotes within the field.
  if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
}

export function convertPapersToCSV(papers: Paper[]): string {
  if (papers.length === 0) {
    return '';
  }

  const headers = ['URL', 'Title', 'Summary'];
  const csvRows = [headers.join(',')];

  papers.forEach(paper => {
    const row = [
      escapeCSVField(paper.pdfLink),
      escapeCSVField(paper.title),
      escapeCSVField(paper.summary) // 'Summary' is the description
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

export function downloadCSV(csvString: string, filename: string): void {
  if (!csvString) return;

  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  // IE Edge workaround for MSBlobBuilder
  // Fix: Cast navigator to any to access msSaveBlob, which is IE/Edge specific
  if ((navigator as any).msSaveBlob) { 
    (navigator as any).msSaveBlob(blob, filename);
  } else {
    if (link.download !== undefined) { // Feature detection
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
        alert("CSV download is not supported by your browser.");
    }
  }
}