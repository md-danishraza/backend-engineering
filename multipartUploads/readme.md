# Multipart Uploads: Visual Architecture & Interactive Guide

An interactive, visual educational guide and simulation engine demonstrating how **Multipart Uploads** work in distributed backend systems and cloud object storage (such as AWS S3, Google Cloud Storage, Azure Blob Storage, and MinIO).

---

## 🚀 How to Run

Simply open `index.html` in your web browser:
- **Direct file access**: Double-click `index.html` or open `file:///d:/codes/node/BackendEngineering/multipartUploads/index.html`
- **Or via local static server**:
  ```bash
  # Using npx serve
  npx serve .
  
  # Or Python 3
  python -m http.server 8080
  ```

---

## 📦 What's Inside

| File | Purpose |
|------|---------|
| [index.html](file:///d:/codes/node/BackendEngineering/multipartUploads/index.html) | Semantic layout with interactive simulation dashboard, speed adjusting controls (`0.25x`, `0.5x`, `1.0x`, `2.0x`), distributed architecture canvas, chunk matrix, lifecycle stepper, head-to-head race track, code viewer, key concepts, and quiz. |
| [styles.css](file:///d:/codes/node/BackendEngineering/multipartUploads/styles.css) | Modern developer aesthetic: dark & light themes, speed button segmented controls, glowing indicators, SVG wire path styling, responsive grid, animated chunks, and telemetry terminal styling. |
| [script.js](file:///d:/codes/node/BackendEngineering/multipartUploads/script.js) | Full simulation engine: dynamically paced worker pool (defaults to `0.25x` super-slow mode for inspecting packets and steps), dynamic SVG packet animations, network failure simulation & auto-retry, inspector modal, comparison race track, and quiz engine. |

---

## 🧠 Key Concepts Covered

1. **The Core Problem**: Why monolithic HTTP POST/PUT fails for large files (timeouts, proxy memory limits, catastrophic 100% restart on network blips).
2. **5-Phase Lifecycle**:
   - `Step 1`: Session Initiation (`CreateMultipartUpload` -> `UploadId`).
   - `Step 2`: Client-side Zero-Copy Slicing via `File.prototype.slice(start, end)`.
   - `Step 3`: Presigned URLs (SigV4) for direct-to-cloud PUTs bypassing app server bandwidth bottlenecks.
   - `Step 4`: Concurrent Part Transfers, ETags, and Per-Chunk Fault Recovery.
   - `Step 5`: Assembly Manifest & S3 Compound ETags (`hash-PartCount`).
3. **S3 Constraints & Limits**:
   - 5 MB minimum chunk size (except last part).
   - 5 GB maximum chunk size.
   - 10,000 maximum parts per object (up to 5 TB total).
4. **Production Architecture**:
   - Resuming interrupted uploads using browser `IndexedDB`.
   - Avoiding surprise AWS charges with S3 `AbortIncompleteMultipartUpload` lifecycle rules.
   - S3 CORS configuration (`ExposeHeaders: ["ETag"]`).
