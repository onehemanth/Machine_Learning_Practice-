# Machine_Learning_Practice

This repository now also includes a practical web page for vendor/customer onboarding from a single KYC PDF.

## Vendor KYC PDF Extractor

Open `vendor_kyc_extractor.html` in a browser. It helps to:

1. Upload one PDF containing documents like GST, Udyam/MSME, Aadhaar, PAN, cancelled cheque.
2. Auto-extract likely values (GSTIN, PAN, IFSC, account no, mobile, etc.) using text pattern matching.
3. Let a human verify and edit all extracted values.
4. Submit and generate a one-row output table.
5. Download the verified data as CSV.

### Notes

- Best results come from text-based PDFs (not scanned images).
- `Company code`, `Nature of service`, and `Account Group` are intentionally left for manual input.
- Always validate all fields before final CSV download.
