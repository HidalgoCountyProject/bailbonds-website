import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { TranslatePipe } from '../shared/pipes/translate.pipe';
import { LanguageService } from '../shared/services/language.service';
import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-defendant-info',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, TranslatePipe, ConfirmModalComponent],
  templateUrl: './defendant-info.component.html',
  styleUrls: ['./defendant-info.component.css']
})
export class DefendantInfoComponent implements OnInit, OnDestroy {
  defendantForm!: FormGroup;
  lang: 'en' | 'es' = 'en';
  
  // Detect browser environment
  isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  
  private originalFooterDisplay: string | null = null;
  private originalHeaderHeight: string | null = null;

  @ViewChild('successModal') successModal?: ConfirmModalComponent;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    // Get language from route params
    const paramLang = this.route.snapshot.paramMap.get('lang');
    this.lang = (paramLang === 'es' ? 'es' : 'en');
    
    // Update the language service to match the URL language
    this.languageService.setLanguage(this.lang);

    // Initialize the form
    this.initializeForm();

    // Load existing data from localStorage if available
    this.loadExistingData();

    // Hide global header and footer
    if (this.isBrowser) {
      // Hide global header
      const headerEl = document.querySelector('header.header') as HTMLElement | null;
      if (headerEl) {
        headerEl.style.display = 'none';
      }

      // Store and override CSS variable so <main> loses top padding
      this.originalHeaderHeight = getComputedStyle(document.documentElement).getPropertyValue('--header-height');
      document.documentElement.style.setProperty('--header-height', '0px');

      // Hide global footer
      const footerEl = document.querySelector('footer.footer') as HTMLElement | null;
      if (footerEl) {
        this.originalFooterDisplay = footerEl.style.display;
        footerEl.style.display = 'none';
      }
    }
  }

  ngOnDestroy(): void {
    // Restore global header and footer
    if (this.isBrowser) {
      // Restore global header
      const headerEl = document.querySelector('header.header') as HTMLElement | null;
      if (headerEl) {
        headerEl.style.display = '';
      }

      // Restore original CSS var
      if (this.originalHeaderHeight) {
        document.documentElement.style.setProperty('--header-height', this.originalHeaderHeight);
      }

      // Restore global footer
      const footerEl = document.querySelector('footer.footer') as HTMLElement | null;
      if (footerEl) {
        footerEl.style.display = this.originalFooterDisplay ?? '';
      }
    }
  }

  private initializeForm(): void {
    this.defendantForm = this.fb.group({
      defendant_first_name: ['', [Validators.required, Validators.minLength(2)]],
      defendant_middle_name: [''], // Optional
      defendant_last_name: ['', [Validators.required, Validators.minLength(2)]],
      defendant_cell_phone: ['', [Validators.required]], // Required
      defendant_email: ['', [Validators.required, Validators.email]],
      defendant_address: ['', [Validators.required, Validators.minLength(8)]],
      defendant_date_of_birth: [''], // Optional - removed required validator
      defendant_birth_city: [''], // Optional - removed required validator
      defendant_birth_state: [''], // Optional - removed required validator
      defendant_arrest_location: [''], // Optional - removed required validator
      defendant_nationality: [''], // Optional - removed required validator
      defendant_probation: [''], // Optional - removed required validator
      defendant_charges_bonds: this.fb.array([]),
      defendant_workplace: ['', [Validators.required, Validators.minLength(2)]]
    });

    // Add at least one charge/bond by default
    this.addChargeBond();
  }

  private loadExistingData(): void {
    if (!this.isBrowser) return;

    try {
      const existingData = localStorage.getItem('indemnitor_field_values');
      if (existingData) {
        const data = JSON.parse(existingData);
        
        // Only populate the defendant-specific fields
        const defendantFields = [
          'defendant_first_name', 'defendant_middle_name', 'defendant_last_name',
          'defendant_cell_phone', 'defendant_email', 'defendant_address', 'defendant_date_of_birth',
          'defendant_birth_city', 'defendant_birth_state', 'defendant_arrest_location',
          'defendant_nationality', 'defendant_probation', 'defendant_workplace'
        ];

        defendantFields.forEach(field => {
          if (data[field]) {
            // Special validation for date of birth field
            if (field === 'defendant_date_of_birth') {
              if (this.validateDateFormat(data[field])) {
                this.defendantForm.get(field)?.setValue(data[field]);
              } else {
                console.warn('Invalid date format in localStorage, clearing field');
                this.defendantForm.get(field)?.setValue('');
              }
            } else {
              this.defendantForm.get(field)?.setValue(data[field]);
            }
          }
        });

        // Load charges and bonds array
        if (data.defendant_charges_bonds && Array.isArray(data.defendant_charges_bonds)) {
          const chargesBondsArray = this.defendantForm.get('defendant_charges_bonds') as FormArray;
          chargesBondsArray.clear();
          data.defendant_charges_bonds.forEach((item: any) => {
            chargesBondsArray.push(this.fb.group({
              charge_name: [item.charge_name || ''],
              bond_amount: [item.bond_amount || '']
            }));
          });
        } else {
          // If no existing charges/bonds data, ensure at least one exists
          const chargesBondsArray = this.defendantForm.get('defendant_charges_bonds') as FormArray;
          if (chargesBondsArray.length === 0) {
            this.addChargeBond();
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load existing defendant data:', error);
    }
  }

  private saveToStorage(): void {
    if (!this.isBrowser) return;

    try {
      const formValues = this.defendantForm.value;
      
      // Validate date format before saving
      if (formValues.defendant_date_of_birth && !this.validateDateFormat(formValues.defendant_date_of_birth)) {
        console.warn('Invalid date format detected, not saving to localStorage');
        return;
      }
      
      // Get existing data from localStorage
      const existingRaw = localStorage.getItem('indemnitor_field_values') || '{}';
      const existingData = JSON.parse(existingRaw);
      
      // Merge form values with existing data
      const mergedData = { ...existingData, ...formValues };
      
      // Save back to localStorage
      localStorage.setItem('indemnitor_field_values', JSON.stringify(mergedData));
    } catch (error) {
      console.warn('Failed to save defendant data:', error);
    }
  }

  onSubmit(): void {
    if (this.defendantForm.valid) {
      // Save to localStorage
      this.saveToStorage();
      
      // Navigate to document wizard
      this.router.navigate(['/wizard', 'indemnitor', this.lang]);
    } else {
      // Show tooltip for required fields without highlighting fields
      this.showRequiredFieldsTooltip();
    }
  }

  private showRequiredFieldsTooltip(): void {
    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'continue-tooltip';
    tooltip.textContent = this.lang === 'es' ? 'Complete los campos para continuar' : 'Fill the fields to continue';
    
    // Add styles
    tooltip.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      color: #fff;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: tooltipFadeIn 0.3s ease;
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes tooltipFadeIn {
        from { opacity: 0; transform: translateX(-50%) translateY(10px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    `;
    document.head.appendChild(style);
    
    // Add to DOM
    document.body.appendChild(tooltip);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, 3000);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  goBack(): void {
    // Show confirmation dialog before clearing data
    const message = this.lang === 'es' 
      ? '<div class="warning-section"><strong>¿Estás seguro de que quieres salir?</strong><br><br>Toda la información ingresada será <strong>borrada por completo</strong>.</div><div class="note-section"></div>'
      : '<div class="warning-section"><strong>Are you sure you want to exit?</strong><br><br>All entered information will be <strong>completely deleted</strong>.</div><div class="note-section"></div>';
    
    const primaryLabel = this.lang === 'es' ? 'Sí, salir' : 'Yes, exit';
    const secondaryLabel = this.lang === 'es' ? 'Cancelar' : 'Cancel';
    
    if (this.successModal) {
      this.successModal.primaryLabel = primaryLabel;
      this.successModal.secondaryLabel = secondaryLabel;
      this.successModal.open(message);
      
      // Subscribe to user choice
      const sub = this.successModal.choice.subscribe((choice) => {
        if (choice === 'primary') {
          // User confirmed - clear data and navigate
          this.clearLocalData();
          this.router.navigateByUrl('/wizard');
        }
        // If choice === 'secondary', user cancelled - do nothing, stay where they are
        sub.unsubscribe();
      });
    } else {
      // Fallback if modal is not available
      const confirmed = window.confirm(message);
      if (confirmed) {
        this.clearLocalData();
        this.router.navigateByUrl('/wizard');
      }
    }
  }

  private clearLocalData(): void {
    if (!this.isBrowser) { return; }
    try {
      localStorage.removeItem('indemnitor_field_values');
      localStorage.removeItem('indemnitor_signature');
    } catch {
      /* ignored – storage may be unavailable */
    }
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.defendantForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.defendantForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return this.lang === 'es' ? 'Este campo es obligatorio' : 'This field is required';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return this.lang === 'es' 
          ? `Mínimo ${requiredLength} caracteres` 
          : `Minimum ${requiredLength} characters`;
      }
      if (field.errors['pattern']) {
        if (fieldName === 'defendant_date_of_birth') {
          return this.lang === 'es' 
            ? 'Formato de fecha inválido. Use MM/DD/YYYY' 
            : 'Invalid date format. Use MM/DD/YYYY';
        }
        return this.lang === 'es' 
          ? 'Formato de teléfono inválido' 
          : 'Invalid phone format';
      }
      if (field.errors['email']) {
        return this.lang === 'es' 
          ? 'Formato de correo electrónico inválido' 
          : 'Invalid email format';
      }
    }
    return '';
  }

  formatDateOfBirth(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Remove non-digits
    
    // Format as MM/DD/YYYY
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2);
    }
    if (value.length >= 5) {
      value = value.substring(0, 5) + '/' + value.substring(5, 9);
    }
    
    // Limit to 10 characters (MM/DD/YYYY)
    value = value.substring(0, 10);
    
    input.value = value;
    
    // Update the form control
    this.defendantForm.get('defendant_date_of_birth')?.setValue(value);
  }

  private validateDateFormat(dateString: string): boolean {
    // Check if the format matches MM/DD/YYYY
    const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }

    // Parse the date to validate it's a real date
    const parts = dateString.split('/');
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Create a Date object and check if it's valid
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day &&
           year >= 1900 && year <= 2100; // Reasonable year range
  }

  // Methods for charges and bonds array
  get chargesBondsArray(): FormArray {
    return this.defendantForm.get('defendant_charges_bonds') as FormArray;
  }

  addChargeBond(): void {
    const chargesBondsArray = this.chargesBondsArray;
    chargesBondsArray.push(this.fb.group({
      charge_name: [''],
      bond_amount: ['']
    }));
  }

  removeChargeBond(index: number): void {
    const chargesBondsArray = this.chargesBondsArray;
    if (chargesBondsArray.length > 0) {
      chargesBondsArray.removeAt(index);
    }
  }

  isChargeBondFieldInvalid(index: number, fieldName: string): boolean {
    const chargeBondGroup = this.chargesBondsArray.at(index) as FormGroup;
    const field = chargeBondGroup.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getChargeBondFieldError(index: number, fieldName: string): string {
    const chargeBondGroup = this.chargesBondsArray.at(index) as FormGroup;
    const field = chargeBondGroup.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return this.lang === 'es' 
          ? `Mínimo ${requiredLength} caracteres` 
          : `Minimum ${requiredLength} characters`;
      }
      if (field.errors['min']) {
        return this.lang === 'es' 
          ? 'El monto debe ser mayor a 0' 
          : 'Amount must be greater than 0';
      }
    }
    return '';
  }
}