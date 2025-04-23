import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './contact-form.component.html',
  styleUrls: ['./contact-form.component.css']
})
export class ContactFormComponent implements OnInit {
  contactForm!: FormGroup;
  submitting = false;
  formError: string | null = null;
  formSuccess = false;
  
  // Usar la URL de la API desde environment
  private apiEndpoint = environment.apiUrl;
  private apiKey = environment.apiKey;

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      phone: ['', [Validators.required, Validators.pattern(/^(\+1|1)?[-\s.]?(\([0-9]{3}\)|[0-9]{3})[-\s.]?[0-9]{3}[-\s.]?[0-9]{4}$/)]],
      email: ['', [Validators.email, Validators.maxLength(150)]],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  get f() { 
    return this.contactForm.controls; 
  }

  onSubmit(): void {
    // Reset estados previos
    this.formError = null;
    this.formSuccess = false;
    
    // Marcar todos los campos como tocados para mostrar errores
    Object.keys(this.contactForm.controls).forEach(key => {
      const control = this.contactForm.get(key);
      control?.markAsTouched();
    });
    
    if (this.contactForm.invalid) {
      this.formError = 'Por favor, completa todos los campos requeridos correctamente.';
      return;
    }
    
    this.submitting = true;
    
    // Configurar los headers con la API key
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey
    });
    
    this.http.post(this.apiEndpoint, this.contactForm.value, { headers })
      .pipe(
        finalize(() => this.submitting = false)
      )
      .subscribe({
        next: (response: any) => {
          console.log('Formulario enviado exitosamente', response);
          this.formSuccess = true;
          this.contactForm.reset();
          // Desplazamiento a la parte superior del formulario
          window.scrollTo({
            top: document.getElementById('contact-form')?.offsetTop || 0,
            behavior: 'smooth'
          });
        },
        error: (error) => {
          console.error('Error al enviar el formulario', error);
          this.formError = error.error?.error || 
                          'Hubo un error al enviar tu mensaje. Por favor intenta nuevamente más tarde.';
        }
      });
  }

  // Método para limpiar mensajes de error/éxito al modificar el formulario
  onInputChange(): void {
    if (this.formError || this.formSuccess) {
      this.formError = null;
      this.formSuccess = false;
    }
  }

  // Formatea el número de teléfono mientras se escribe
  formatPhoneNumber(event: any): void {
    const input = event.target;
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 0) {
      if (value.length <= 3) {
        value = `(${value}`;
      } else if (value.length <= 6) {
        value = `(${value.substring(0, 3)}) ${value.substring(3)}`;
      } else {
        value = `(${value.substring(0, 3)}) ${value.substring(3, 6)}-${value.substring(6, 10)}`;
      }
    }
    
    this.contactForm.get('phone')?.setValue(value, { emitEvent: false });
  }
} 