# Documents Workflow – Front-End Plan

This document summarizes the feature we will add to **Affordable Bail Bonds**: a guided "Documents Wizard" that lets clients fill and sign four PDF contracts, capture a photo of their ID, and deliver the final PDFs to the backend (AWS).  
Everything described here concerns **front-end implementation only**; backend work is noted but deferred.

---
## 1. Goals
1. Allow a user to finish a 4-step paperwork package entirely from a phone.
2. Use the **existing AcroForm fields** inside each PDF instead of duplicating them in HTML.
3. Capture two extra artefacts not present in the PDFs:
   • Photo of government ID (JPEG)  
   • Hand-drawn signature (PNG)
4. Embed the photo + signature into the PDFs where placeholder fields exist.
5. Produce 
   ```
   Uint8Array[]   // 4 finished PDFs
   Blob           // idPhoto
   Blob           // signature
   ```
   and pass them to an upload service (to be built in the backend phase).
6. Keep the landing bundle small (lazy-load, dynamic imports, Web Workers).

---
## 2. Folder & routing layout
```
src/app/documents/
  ├── services/
  │   ├── pdf-form.service.ts      // pdf-lib wrapper
  │   ├── wizard-state.service.ts  // BehaviourSubjects for steps & artefacts
  │   └── capture.service.ts       // camera helpers
  ├── components/
  │   ├── pdf-step.component.ts    // one per PDF
  │   ├── id-capture.component.ts  // camera dialog
  │   ├── signature-pad.component.ts
  │   └── review.component.ts
  └── document-wizard.component.ts // master stepper
```
Router entry (added to `app.routes.ts`):
```ts
{
  path: 'documents',
  loadComponent: () => import('./documents/document-wizard.component')
                     .then(m => m.DocumentWizardComponent)
}
```
Result: the entire feature is loaded **only** when a user navigates to `/documents`.

---
## 3. Core libraries
* `pdf-lib` – programmatic form filling & image embedding (lazy imported).
* `ngx-extended-pdf-viewer` – renders live preview; internally uses pdf.js Web Worker.
* `signature_pad` – 2 kB gzipped; captures strokes on `<canvas>`.
* (Optional) `browser-image-compression` in a Web Worker for shrinking ID photos before embedding.

All dependencies will be listed under `package.json > dependencies` once we scaffold the module.

---
## 4. Services (detailed)
### 4.1 PdfFormService
```
loadPdf(url): Promise<PdfDoc>
buildForm(pdfDoc): FormGroup   // dynamic
applyFormValues(pdfDoc, form): void
stampImage(pdfDoc, fieldName, blob): Promise<void>
save(pdfDoc): Promise<Uint8Array>
```
Field discovery ensures we never hard-code field lists.

### 4.2 WizardStateService
Holds:
```
currentStep$          : Signal / BehaviorSubject<number>
forms                 : { pdfUrl, pdfDoc, formGroup }[]
idPhoto?: Blob
signature?: Blob
```
Also exposes `complete$` that emits the final object when Review step is confirmed.

### 4.3 CaptureService
* `capturePhoto(): Observable<Blob>` – wraps `getUserMedia` & canvas.
* `captureSignature(): Observable<Blob>` – returns PNG blob from `signature_pad`.

---
## 5. Component step flow
1. **PdfStepComponent (×4)**  
   Builds reactive form from PDF; displays inputs + real-time preview.
2. **IdCaptureComponent**  
   Presents camera stream, returns JPEG to WizardStateService.
3. **SignaturePadComponent**  
   Full-screen draw pad (landscape on mobile); returns PNG.
4. **ReviewComponent**  
   Shows thumbnails & 'Finish' button → generates all four final PDFs;
   emits `{ pdfs, idPhoto, signature, rawFormData }`.

---
## 6. Performance checklist
* Entire folder is lazy-loaded.
* `await import('pdf-lib')` inside PdfFormService so main bundle is untouched.
* OnPush change detection everywhere.
* Debounce preview regeneration (400 ms) so typing doesn't thrash CPU.
* Optional Web Worker for photo compression / PDF flattening.

---
## 7. Minimal backend interface (to be built later)
Front-end only needs two calls:
1. **Obtain signed URLs** – POST list of filenames → receive four S3 pre-signed PUT URLs.
2. **Upload** – `PUT` each `Uint8Array` to its corresponding URL.

Future extensions (handled server-side):
* Lambda to merge all PDFs into one combined document.
* SNS / SES to e-mail signed contract to client & staff.
* CloudWatch Logs + DynamoDB for audit.

---
## 8. Implementation timeline
| Day | Task |
| --- | ---- |
| 1 | Scaffold branch, install libs, create lazy route |
| 2 | Implement PdfFormService & dynamic form generation |
| 3 | Build PdfStepComponent & first PDF flow |
| 4 | IdCaptureComponent & SignaturePadComponent |
| 5 | Review screen + final PDF generation |
| 6 | Polish UX, mobile testing |
| 7 | Handover & integrate with backend API |

---
### Ready for dev 🚀
When this README is merged, the next step is to run:
```bash
npm install pdf-lib ngx-extended-pdf-viewer signature_pad
```
and start coding inside `src/app/documents/` following the structure above. 