import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

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
  error: string = '';
  downloadingFiles: Set<string> = new Set();
  uploaderName: string = '';
  uploaderRole: string = '';

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.uploadId = params['uploadId'] || '';
      if (this.uploadId) {
        this.loadFiles();
      } else {
        this.error = 'download.error';
        this.loading = false;
      }
    });
  }

  loadFiles(): void {
    this.loading = true;
    this.error = '';
    this.apiService.listFiles(this.uploadId).subscribe({
      next: (response: any) => {
        this.files = (response.files || []).map((filename: string) => ({ filename }));
        this.uploaderName = response.uploaderName || '';
        this.uploaderRole = response.uploaderRole || '';
        this.loading = false;
        this.error = '';
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
    // Si quieres dejar la simulación como fallback, descomenta esto:
    // setTimeout(() => {
    //   alert(`Descarga simulada de: ${filename}`);
    //   this.downloadingFiles.delete(filename);
    // }, 1000);
  }
} 