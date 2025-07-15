import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { take } from 'rxjs/operators';

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
  uploaderName: string = '';
  uploaderRole: string = '';

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {
    console.log('DownloadComponent constructor called');
    console.log('Route object:', this.route);
    console.log('ApiService object:', this.apiService);
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
    
    this.route.queryParams.pipe(take(1)).subscribe(params => {
      console.log('Route params received:', params);
      console.log('uploadId from params:', params['uploadId']);
      
      this.uploadId = params['uploadId'] || '';
      console.log('Final uploadId value:', this.uploadId);
      
      if (this.uploadId) {
        console.log('uploadId is valid, calling loadFiles()');
        this.loadFiles();
      } else {
        console.log('uploadId is empty or invalid, setting error');
        this.error = 'download.error';
        this.loading = false;
      }
    });
    
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
    
    console.log('About to call apiService.generateDownloadLink');
    this.apiService.generateDownloadLink(this.uploadId, filename).subscribe({
      next: (response: any) => {
        console.log('API generateDownloadLink SUCCESS - response:', response);
        console.log('Response URL:', response.url);
        
        if (response.url) {
          console.log('Opening URL in new tab:', response.url);
          window.open(response.url, '_blank');
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
} 