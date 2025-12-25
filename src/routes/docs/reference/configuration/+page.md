# Configuration Reference

Complete `.zone5.toml` configuration schema.

---

## File Location

Zone5 looks for `.zone5.toml` in the current directory and walks up the directory tree until it finds one. This allows you to place the config at your project root.

## Configuration Schema

### [base] Section

Controls where Zone5 finds and stores files.

| Option      | Type   | Default    | Description                                                   |
| ----------- | ------ | ---------- | ------------------------------------------------------------- |
| `root`      | string | `"."`      | Source image directory. Paths in config are relative to this. |
| `cache`     | string | `".zone5"` | Directory where processed images and metadata are stored.     |
| `namespace` | string | `"@zone5"` | URL namespace for serving images. Used in asset URLs.         |

### [processor] Section

Controls how images are processed.

| Option          | Type     | Default                        | Description                                                                                                              |
| --------------- | -------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `variants`      | number[] | `[640, 768, 1280, 1920, 2560]` | Array of widths (in pixels) to generate for each image.                                                                  |
| `resize_kernel` | string   | `"mks2021"`                    | Sharp resize kernel. Options: `"nearest"`, `"cubic"`, `"mitchell"`, `"lanczos2"`, `"lanczos3"`, `"mks2013"`, `"mks2021"` |
| `resize_gamma`  | number   | (none)                         | Optional gamma correction for resizing. Range: 1.0 - 3.0. When not set, no gamma correction is applied.                  |

### [gallery] Section

Default settings for the Zone5 gallery component. These values are used when options are not specified in frontmatter or component props.

| Option               | Type                   | Default                           | Description                                                                   |
| -------------------- | ---------------------- | --------------------------------- | ----------------------------------------------------------------------------- |
| `mode`               | string                 | `"wall"`                          | Default gallery layout: `"wall"`, `"waterfall"`, or `"justified"`             |
| `columnBreakpoints`  | object (string: int)   | `{ "640": 2, "768": 3, "1024": 4 }` | Viewport width (px) to column count mapping for waterfall mode             |
| `targetRowHeight`    | integer                | `300`                             | Target row height in pixels for justified mode                                |
| `gap`                | integer                | `8`                               | Gap between images in pixels for justified mode                               |
| `panoramaThreshold`  | number                 | `3.0`                             | Aspect ratio threshold for panoramic images (gets own row in justified mode)  |

Note: TOML requires string keys in tables, so `columnBreakpoints` uses string keys like `"640"` instead of numeric keys.

## Examples

### Minimal Configuration

```toml
# .zone5.toml
[base]
root = "."
```

Uses all defaults. Images are processed from the current directory.

### Standard Configuration

```toml
# .zone5.toml
[base]
root = "static/images"
cache = ".zone5"
namespace = "@zone5"

[processor]
variants = [640, 768, 1280, 1920, 2560]
```

### Custom Variant Sizes

```toml
# .zone5.toml
[base]
root = "content/photos"

[processor]
# Fewer variants for smaller bundle
variants = [400, 800, 1600]
```

### Gallery Defaults

```toml
# .zone5.toml
[gallery]
# Use justified layout by default
mode = "justified"
targetRowHeight = 250
gap = 4

# For waterfall mode
[gallery.columnBreakpoints]
"640" = 2
"768" = 3
"1024" = 4
"1280" = 5
```

## Loading Configuration Programmatically

```typescript
import { load } from 'zone5';

const config = await load();
// or specify directory
const config = await load('/path/to/project');
```

## Related

- [Customize Image Variants](../../how-to/customize-image-variants/) - How to optimize variant configuration
- [Caching Strategy](../../explanation/caching-strategy/) - How the cache works
- [Configure Caching](../../how-to/configure-caching/) - Managing the cache directory
