import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
export declare class ApiService {
    private http;
    constructor(http: HttpClient);
    sendContactForm(formData: any): Observable<any>;
}
