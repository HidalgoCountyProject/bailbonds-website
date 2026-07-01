import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

/**
 * Fields that only exist in localStorage once the user has actually completed
 * the standalone "Defendant Information" step (defendant-info.component.ts).
 * `defendant_first_name`/`defendant_last_name` are intentionally excluded because
 * those can also be captured directly from the indemnitor PDF's own AcroForm
 * fields, which would produce a false positive.
 */
export const REQUIRED_DEFENDANT_INFO_FIELDS = [
  'defendant_phone_area',
  'defendant_phone_prefix',
  'defendant_phone_line',
  'defendant_email',
  'defendant_address_house',
  'defendant_address_street',
  'defendant_address_city',
  'defendant_address_state',
  'defendant_address_zip',
  'defendant_workplace',
] as const;

/** Checks whether `indemnitor_field_values` in localStorage already has all required defendant-info fields. */
export function hasCompletedDefendantInfo(): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return true; // SSR: nothing to check, browser guard is what matters
  }

  try {
    const raw = localStorage.getItem('indemnitor_field_values');
    const data = raw ? JSON.parse(raw) : {};
    return REQUIRED_DEFENDANT_INFO_FIELDS.every(
      (field) => typeof data[field] === 'string' && data[field].trim().length > 0
    );
  } catch {
    return false;
  }
}

/**
 * Prevents entering the document wizard (`/wizard/indemnitor/:lang`) for the
 * indemnitor role until the dedicated Defendant Information step has been
 * completed. Without this guard, a direct/bookmarked/restored URL to that
 * route bypasses the required fields entirely, producing PDFs with missing
 * defendant data (phone, address, DOB, arrest info, workplace, etc.).
 */
export const defendantInfoCompletedGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const role = route.paramMap.get('role');
  const lang = route.paramMap.get('lang') ?? 'en';

  if (role !== 'indemnitor') {
    return true; // The defendant-role flow doesn't go through this step
  }

  if (hasCompletedDefendantInfo()) {
    return true;
  }

  return router.createUrlTree(['/wizard/indemnitor', lang, 'defendant-info']);
};
