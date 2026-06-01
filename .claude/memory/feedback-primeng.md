---
name: PrimeNG Integration Patterns
description: PrimeNG component usage patterns — FileUploadModule tag is p-fileupload, providePrimeNG in app config, customUpload with uploadHandler event, mode="basic" vs "advanced".
type: feedback
---

Use PrimeNG components where available instead of building custom UI from scratch.

**Why:** User explicitly asked to use PrimeNG's upload component ("pode usar o componente de upload do primNG") instead of the custom file input. The linter also tends to break PrimeNG tags (changes `p-fileupload` to `p-uploadfile`).

**How to apply:**
- Import from module: `import { FileUploadModule } from 'primeng/fileupload'` — NOT `import { FileUpload } from 'primeng/fileupload'`
- Template tag: `<p-fileupload>` — NOT `<p-upload>` or `<p-uploadfile>` (linter sometimes corrupts this)
- Custom upload mode: `[customUpload]="true"` + `(uploadHandler)="onUpload($event)"` — NOT `(onSelect)` for custom uploads
- Always set `name="fieldName"` (required) and `accept=".pdf"` for type restriction
- Basic mode: `mode="basic"` for simple button-style upload without drag-drop
- Style with `styleClass="p-button-outlined"` or `"p-button-secondary p-button-sm"`
- Add `providePrimeNG()` to app.config.ts providers for full theming support
- Verify build passes after adding PrimeNG imports — the module tree-shaking can cause issues if imported incorrectly

**`mode="basic"` gotcha (2026-06-01):** `mode="basic"` renders a native file input that shows browser's "No file chosen" text next to the button label — this cannot be hidden with CSS alone. For full visual control, use `mode="advanced"` with `<ng-template #empty>` for the empty state and `[showUploadButton]="false" [showCancelButton]="false"` to hide the extra buttons.

**Why:** User tested the upload and saw "Selecionar PDFNo file chosen" merged into one line — the native input text is injected by the browser, not controllable via PrimeNG props.

**How to apply:** Use `mode="advanced"` with custom empty template when you need pixel-perfect upload UI. Only use `mode="basic"` when the native behavior is acceptable.

**FileUpload events gotcha:** `(onSelect)` fires when files are selected (gives `{ files: File[] }`). `(uploadHandler)` fires when upload is triggered in custom mode (gives `{ files: File[] }`). For custom upload with immediate processing on selection, use `(onSelect)`. For manual upload flow, use `(uploadHandler)`.

**Why:** Confusion between events caused upload handler not firing. The `(onSelect)` is the right event for immediate file processing in custom mode.
