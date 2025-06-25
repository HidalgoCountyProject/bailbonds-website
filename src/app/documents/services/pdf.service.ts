import { Injectable } from '@angular/core';
import { getDocument, GlobalWorkerOptions, PDFDocumentProxy } from 'pdfjs-dist';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  constructor() {
    // Configure the worker once. The minified worker file is copied to assets already.
    GlobalWorkerOptions.workerSrc = '/assets/pdf.worker.min.js';
  }

  /**
   * Loads a PDF file and returns a PDFDocumentProxy instance.
   * @param url URL or relative path pointing to the PDF resource.
   */
  load(url: string): Promise<PDFDocumentProxy> {
    return getDocument(url).promise;
  }
}
