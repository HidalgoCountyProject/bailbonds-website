import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) { 
    console.log('ApiService constructor called');
    console.log('HttpClient object:', this.http);
    console.log('Environment endpoints:', {
      endpointListFiles: environment.endpointListFiles,
      endpointGenerateDownloadLink: environment.endpointGenerateDownloadLink
    });
    console.log('Environment object:', environment);
  }
  
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
    console.log('ApiService.listFiles() - START');
    console.log('uploadId parameter:', uploadId);
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    
    // Usar path parameter en lugar de query parameter
    const url = `${environment.endpointListFiles}/${uploadId}`;
    console.log('Environment endpointListFiles:', environment.endpointListFiles);
    console.log('Making HTTP GET request to:', url);
    console.log('Headers:', headers);
    console.log('HttpClient available:', !!this.http);
    
    const observable = this.http.get<any>(url, { headers });
    
    console.log('ApiService.listFiles() - returning observable');
    console.log('Observable type:', typeof observable);
    return observable;
  }

  /**
   * Generates a download link for a specific file
   */
  generateDownloadLink(uploadId: string, filename: string): Observable<any> {
    console.log('ApiService.generateDownloadLink() - START');
    console.log('uploadId parameter:', uploadId);
    console.log('filename parameter:', filename);
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': environment.apiKey
    });
    
    const url = `${environment.endpointGenerateDownloadLink}?uploadId=${uploadId}&filename=${encodeURIComponent(filename)}`;
    console.log('Making HTTP GET request to:', url);
    console.log('Headers:', headers);
    
    const observable = this.http.get<any>(url, { headers });
    
    console.log('ApiService.generateDownloadLink() - returning observable');
    return observable;
  }
} 