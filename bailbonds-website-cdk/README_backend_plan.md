# Affordable Bail Bonds – Backend (CDK) Roadmap

This file tracks the work we will do inside the **bailbonds-website-cdk** project.  The objective is to provision every server-side resource (S3, Lambda, API Gateway, IAM, etc.) that supports the web application without touching the existing static-hosting stack.

---
## 1  Current State
• Static site served by Route 53 → CloudFront → public S3 bucket.  
• API Gateway (REST, id `41ot62efvg`) with `/contact` → Lambda → SNS → bondsman.  
• No storage for PDFs or images yet.

---
## 2  Target Architecture for "Documents Wizard"
1. **Private S3 bucket** `affordable-documents-${env}`
   * Block Public Access = ON
   * Two prefixes: `uploads/raw/` & `uploads/final/`
2. **Lambda 1 – createUploadUrls**
   * Input (POST `/documents/presign`): `{ files: ["app_1.pdf", …] }`
   * Generates pre-signed `PUT` URLs (15 min TTL) scoped to `uploads/raw/${uuid}/filename`.
3. **Angular uploads** – browser performs direct `PUT` to S3.
4. **Lambda 2 – completeDocuments** (optional merge)
   * Triggered by POST or S3 ObjectCreated event.
   * (a) Validates all 4 PDFs arrived.  
   * (b) Optionally merges them & stamps ID + signature.  
   * (c) Stores combined file in `uploads/final/${uuid}.pdf`.
   * (d) Sends SNS SMS / SES email to bondsman.
5. **DynamoDB table** `DocumentJobs` for audit (PK `jobId`).
6. **API Key / Usage Plan** for the new `/documents/*` endpoints (same key as `/contact`).

---
## 3  CDK Stack Layout
```
lib/
 ├─ storage-stack.ts          // S3 bucket + (optional) DynamoDB
 ├─ api-stack.ts              // RestApi resources, Lambda integrations
 └─ functions/
       createUploadUrls.ts    // Lambda source
       completeDocuments.ts
```
The entry `bailbonds-website-cdk-stack.ts` will instantiate `StorageStack` first, then pass its bucket reference into `ApiStack`.

---
## 4  Immediate Next Steps
1. **StorageStack**  
   • Create bucket, export its name.  
   • (Optional) create DynamoDB table.  
2. **createUploadUrls Lambda**  
   • Scaffolding code with `aws-sdk v3` S3 `PutObjectCommand`, `getSignedUrl`.  
   • IAM policy: `s3:PutObject` on bucket ARN with `uploads/raw/*`.  
3. **ApiStack**  
   • Import existing RestApi via `RestApi.fromRestApiAttributes` (id `41ot62efvg`).  
   • Add resource `/documents` → child `/presign`.  
   • Link to Lambda integration + request/response models.  
4. **Deploy to `dev` stage**  
   `npx cdk deploy --profile affordable-dev`

---
## 5  Backlog
• completeDocuments Lambda & merge logic.  
• Step Functions state machine for long-running workflows.  
• Cognito unauth role + scoped S3 permissions (if stronger auth needed).  
• CloudWatch dashboards & alarms.  
• Terraform export or CFN StackSets for multi-region.

---
_Last updated {{DATE}}_ 