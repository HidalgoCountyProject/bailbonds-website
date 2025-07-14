import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) { }
  
  // Método para enviar el formulario de contacto
  sendContactForm(formData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': environment.apiKey
    });

    return this.http.post<any>(environment.apiUrl, formData, { headers });
  }

  // Calls the /initprocess endpoint to initiate the document upload process
  initProcess(payload: { files: string[] }): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post<any>(environment.endpointInitProcess, payload, { headers });
  }

  /**
   * Uploads files to their corresponding presigned URLs in parallel.
   * @param urls Array of { filename, url }
   * @param fileLookupFn Function to get the Blob/File for a given filename
   * @returns Observable with upload results for each file
   */
  uploadFilesToPresignedUrls(
    urls: { filename: string, url: string }[],
    fileLookupFn: (filename: string) => Blob | File | null
  ): Observable<any[]> {
    const uploadObservables = urls.map(fileInfo => {
      const file = fileLookupFn(fileInfo.filename);
      if (!file) {
        return of({ filename: fileInfo.filename, error: 'File not found' });
      }
      let contentType = 'application/pdf';
      if (fileInfo.filename.endsWith('.jpg') || fileInfo.filename.endsWith('.jpeg')) {
        contentType = 'image/jpeg';
      }
      return this.http.put(fileInfo.url, file, {
        headers: { 'Content-Type': contentType }
      }).pipe(
        map(() => ({ filename: fileInfo.filename, success: true })),
        catchError(error => of({ filename: fileInfo.filename, error }))
      );
    });
    return forkJoin(uploadObservables);
  }

  /**
   * Calls the complete documents endpoint after successful upload
   * Now also sends lang and role for backend processing
   */
  completeDocuments(payload: { uploadId: string, files: string[], formData: any, lang: string, role: string }): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(environment.endpointCompleteDocuments, payload, { headers });
  }

  /**
   * Lists files for a given uploadId
   */
  listFiles(uploadId: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    return this.http.get<any>(`${environment.endpointListFiles}?uploadId=${uploadId}`, { headers });
  }

  /**
   * Generates a download link for a specific file
   */
  generateDownloadLink(uploadId: string, filename: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': environment.apiKey
    });
    return this.http.get<any>(`${environment.endpointGenerateDownloadLink}?uploadId=${uploadId}&filename=${encodeURIComponent(filename)}`, { headers });
  }
} 