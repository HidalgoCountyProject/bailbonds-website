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
  ) {}

  ngOnInit(): void {
    console.log('DownloadComponent ngOnInit');
    this.route.queryParams.pipe(take(1)).subscribe(params => {
      this.uploadId = params['uploadId'] || '';
      if (this.uploadId) {
        console.log('Calling loadFiles from ngOnInit');
        this.loadFiles();
      } else {
        this.error = 'download.error';
        this.loading = false;
      }
    });
  }

  loadFiles(): void {
    console.log('loadFiles called');
    this.loading = true;
    this.error = null;
    this.apiService.listFiles(this.uploadId).subscribe({
      next: (response: any) => {
        console.log('API response:', response);
        this.files = (response.files || []).map((filename: string) => ({ filename }));
        this.uploaderName = response.uploaderName || '';
        this.uploaderRole = response.uploaderRole || '';
        this.loading = false;
        this.error = null;
      },
      error: (error: any) => {
        console.error('Error loading files:', error);
        this.error = 'download.error';
        this.loading = false;
        this.files = [];
        this.uploaderName = '';
        this.uploaderRole = '';
      }
    });
  }

  downloadFile(filename: string): void {
    if (this.downloadingFiles.has(filename)) {
      return; // Prevent multiple clicks
    }
    this.downloadingFiles.add(filename);
    this.apiService.generateDownloadLink(this.uploadId, filename).subscribe({
      next: (response: any) => {
        if (response.url) {
          window.open(response.url, '_blank');
        } else {
          this.error = 'download.error';
        }
        this.downloadingFiles.delete(filename);
      },
      error: (error: any) => {
        console.error('Error generating download link:', error);
        this.error = 'download.error';
        this.downloadingFiles.delete(filename);
      }
    });
  }
} 