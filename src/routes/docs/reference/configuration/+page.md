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
