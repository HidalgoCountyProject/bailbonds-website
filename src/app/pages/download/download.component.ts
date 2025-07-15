import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { Location } from '@angular/common';

interface FileItem {
  filename: string;
}

@Component({
  selector: 'app-download',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './download.component.html',
  styleUrls: ['./download.component.css']
})
export class DownloadComponent implements OnInit {
  uploadId: string = '';
  files: FileItem[] = [];
  loading: boolean = true;
  error: string | null = null;
  downloadingFiles: Set<string> = new Set();
  viewingFiles: Set<string> = new Set();
  uploaderName: string = '';
  uploaderRole: string = '';

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private location: Location
  ) {
    console.log('DownloadComponent constructor called');
    console.log('Route object:', this.route);
    console.log('ApiService object:', this.apiService);
    console.log('Location object:', this.location);
  }

  ngOnInit(): void {
    console.log('DownloadComponent ngOnInit - START');
    console.log('Component state at ngOnInit:', {
      uploadId: this.uploadId,
      loading: this.loading,
      error: this.error,
      files: this.files
    });
    console.log('Route params subscription starting...');
    
    // Verificar el estado completo de la ruta
    console.log('Current route URL:', window.location.href);
    console.log('Current route pathname:', window.location.pathname);
    console.log('Current route search:', window.location.search);
    console.log('Current route hash:', window.location.hash);
    
    // Verificar usando Angular Location service
    console.log('Angular Location path:', this.location.path());
    
    // Verificar si Angular está funcionando correctamente
    console.log('Angular route object:', this.route);
    console.log('Route snapshot:', this.route.snapshot);
    console.log('Route snapshot params:', this.route.snapshot.params);
    console.log('Route snapshot paramMap:', this.route.snapshot.paramMap);
    
    // Obtener uploadId del path parameter (como en tu proyecto)
    this.uploadId = this.route.snapshot.paramMap.get('uploadId') || '';
    console.log('uploadId from paramMap:', this.uploadId);
    console.log('uploadId type:', typeof this.uploadId);
    
    if (this.uploadId) {
      console.log('uploadId is valid, calling loadFiles()');
      this.loadFiles();
    } else {
      console.log('uploadId is empty or invalid, setting error');
      this.error = 'download.error';
      this.loading = false;
    }
    
    console.log('DownloadComponent ngOnInit - END');
  }

  loadFiles(): void {
    console.log('loadFiles() - START');
    console.log('uploadId being used:', this.uploadId);
    console.log('Current loading state:', this.loading);
    console.log('Current error state:', this.error);
    
    this.loading = true;
    this.error = null;
    
    console.log('About to call apiService.listFiles with uploadId:', this.uploadId);
    
    const subscription = this.apiService.listFiles(this.uploadId).subscribe({
      next: (response: any) => {
        console.log('API listFiles SUCCESS - response received:', response);
        console.log('Response type:', typeof response);
        console.log('Response keys:', Object.keys(response));
        
        this.files = (response.files || []).map((filename: string) => ({ filename }));
        console.log('Processed files array:', this.files);
        
        this.uploaderName = response.uploaderName || '';
        this.uploaderRole = response.uploaderRole || '';
        console.log('Uploader name:', this.uploaderName);
        console.log('Uploader role:', this.uploaderRole);
        
        this.loading = false;
        this.error = null;
        console.log('loadFiles() - SUCCESS END');
      },
      error: (error: any) => {
        console.error('API listFiles ERROR - error details:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error body:', error.error);
        
        this.error = 'download.error';
        this.loading = false;
        this.files = [];
        this.uploaderName = '';
        this.uploaderRole = '';
        console.log('loadFiles() - ERROR END');
      }
    });
    
    console.log('Subscription created:', subscription);
    console.log('loadFiles() - SUBSCRIPTION SETUP COMPLETE');
  }

  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  downloadFile(filename: string): void {
    console.log('downloadFile() - START');
    console.log('Filename to download:', filename);
    console.log('Current uploadId:', this.uploadId);
    console.log('Currently downloading files:', Array.from(this.downloadingFiles));
    
    if (this.downloadingFiles.has(filename)) {
      console.log('File already being downloaded, skipping');
      return; // Prevent multiple clicks
    }
    
    this.downloadingFiles.add(filename);
    console.log('Added to downloading set:', filename);
    
    const isMobile = this.isMobileDevice();
    console.log('Is mobile device:', isMobile);
    
    console.log('About to call apiService.generateDownloadLink');
    this.apiService.generateDownloadLink(this.uploadId, filename).subscribe({
      next: (response: any) => {
        console.log('API generateDownloadLink SUCCESS - response:', response);
        console.log('Response URL:', response.url);
        
        if (response.url) {
          if (isMobile) {
            // For mobile devices, use direct URL opening as fallback
            console.log('Mobile device detected, opening URL directly for download');
            window.open(response.url, '_blank');
          } else {
            // For desktop, use blob method
            console.log('Desktop device detected, fetching file as blob for download:', response.url);
            
            // Use fetch to get the file as a blob for cross-origin download
            fetch(response.url)
              .then(response => {
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.blob();
              })
              .then(blob => {
                console.log('Successfully fetched blob:', blob);
                
                // Create a temporary URL for the blob
                const blobUrl = URL.createObjectURL(blob);
                
                // Create a temporary anchor element to trigger download
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = filename;
                link.style.display = 'none';
                document.body.appendChild(link);
                
                // Trigger the download
                link.click();
                
                // Clean up after download
                setTimeout(() => {
                  document.body.removeChild(link);
                  URL.revokeObjectURL(blobUrl);
                  console.log('Cleaned up download link and blob URL');
                }, 100);
              })
              .catch(error => {
                console.error('Error fetching file as blob:', error);
                console.log('Blob method failed, falling back to direct URL');
                // Fallback to direct URL if blob method fails
                window.open(response.url, '_blank');
              });
          }
        } else {
          console.log('No URL in response, setting error');
          this.error = 'download.error';
        }
        this.downloadingFiles.delete(filename);
        console.log('Removed from downloading set:', filename);
        console.log('downloadFile() - SUCCESS END');
      },
      error: (error: any) => {
        console.error('API generateDownloadLink ERROR - error details:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error body:', error.error);
        
        this.error = 'download.error';
        this.downloadingFiles.delete(filename);
        console.log('Removed from downloading set:', filename);
        console.log('downloadFile() - ERROR END');
      }
    });
    
    console.log('downloadFile() - SUBSCRIPTION SETUP COMPLETE');
  }

  viewFile(filename: string): void {
    console.log('viewFile() - START');
    console.log('Filename to view:', filename);
    console.log('Current uploadId:', this.uploadId);
    console.log('Currently viewing files:', Array.from(this.viewingFiles));
    
    if (this.viewingFiles.has(filename)) {
      console.log('File already being viewed, skipping');
      return; // Prevent multiple clicks
    }
    
    this.viewingFiles.add(filename);
    console.log('Added to viewing set:', filename);
    
    console.log('About to call apiService.generateDownloadLink for viewing');
    this.apiService.generateDownloadLink(this.uploadId, filename).subscribe({
      next: (response: any) => {
        console.log('API generateDownloadLink SUCCESS for viewing - response:', response);
        console.log('Response URL:', response.url);
        
        if (response.url) {
          console.log('Opening URL in new tab for viewing:', response.url);
          window.open(response.url, '_blank');
        } else {
          console.log('No URL in response for viewing, setting error');
          this.error = 'download.error';
        }
        this.viewingFiles.delete(filename);
        console.log('Removed from viewing set:', filename);
        console.log('viewFile() - SUCCESS END');
      },
      error: (error: any) => {
        console.error('API generateDownloadLink ERROR for viewing - error details:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error body:', error.error);
        
        this.error = 'download.error';
        this.viewingFiles.delete(filename);
        console.log('Removed from viewing set:', filename);
        console.log('viewFile() - ERROR END');
      }
    });
    
    console.log('viewFile() - SUBSCRIPTION SETUP COMPLETE');
  }
} 