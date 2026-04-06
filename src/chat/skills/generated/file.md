<!-- Auto-generated from capability registry. Do not edit manually. -->

# File Tools

2 tools in this category.

### file upload (`file_upload`)

Upload an image file from a local path. Returns the file ID for use with space/event image fields. Recommended dimensions: 800x800 pixels for event covers and space avatars.

- **Backend:** graphql → `createFile` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `file_path` (string, required) — Local file path to upload (supports: png, jpg, jpeg, gif, svg, webp)
  - `directory` (string, optional) — Upload directory context
  - `description` (string, optional) — File description

---

### file upload url (`file_upload_url`)

Upload an image from a URL (the server downloads it). Returns the file ID. Recommended: 800x800 pixels for event covers and space avatars.

- **Backend:** graphql → `createFile` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `url` (string, required) — URL of the image to upload
  - `description` (string, optional) — File description

---

## Related Tools

`file_upload`, `file_upload_url`
