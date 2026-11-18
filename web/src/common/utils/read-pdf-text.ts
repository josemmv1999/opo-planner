import { InjectionToken } from '@angular/core';

const WORKER_SRC = '/pdfjs/pdf.worker.min.mjs';

export const readPdfText = async (file: File): Promise<string> => {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const document = await task.promise;
  const pages = await Promise.all(
    Array.from({ length: document.numPages }, async (_, i) => {
      const { items } = await (await document.getPage(i + 1)).getTextContent();
      return items
        .map((item) => ('str' in item ? item.str + (item.hasEOL ? '\n' : '') : ''))
        .join('');
    }),
  );
  await task.destroy();
  return pages.join('\n');
};

export const READ_PDF_TEXT = new InjectionToken<(file: File) => Promise<string>>('READ_PDF_TEXT', {
  factory: () => readPdfText,
});
