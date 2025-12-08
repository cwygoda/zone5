# Configuration Reference

Complete `.zone5.toml` configuration schema.

---

## File Location

Zone5 looks for `.zone5.toml` in the current directory and walks up the directory tree until it finds one. This allows you to place the config at your project root.

## Configuration Schema

### [base] Section

Controls where Zone5 finds and stores files, and configures display options.

| Option      | Type   | Default    | Description                                                   |
| ----------- | ------ | ---------- | ------------------------------------------------------------- |
| `root`      | string | `"."`      | Source image directory. Paths in config are relative to this. |
| `cache`     | string | `".zone5"` | Directory where processed images and metadata are stored.     |
| `namespace` | string | `"@zone5"` | URL namespace for serving images. Used in asset URLs.         |
| `mapUrl`    | string | (none)     | URL template for GPS coordinates in lightbox. See [Map URL Configuration](#map-url-configuration). |

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

## Map URL Configuration

The `mapUrl` option configures where GPS coordinates link to in the EXIF info overlay. When an image has GPS data, clicking the location opens the configured map service.

### Template Placeholders

| Placeholder | Description              |
| ----------- | ------------------------ |
| `{lat}`     | Latitude (decimal degrees)  |
| `{lon}`     | Longitude (decimal degrees) |

### Default Behavior

If `mapUrl` is not set, Zone5 uses Google Earth:

```
https://earth.google.com/web/@{lat},{lon},0a,1000d,35y,0h,0t,0r
```

### Map Provider Examples

```toml
# Google Earth (default)
mapUrl = "https://earth.google.com/web/@{lat},{lon},0a,1000d,35y,0h,0t,0r"

# Google Maps (satellite view)
mapUrl = "https://www.google.com/maps?q={lat},{lon}&t=k"

# OpenStreetMap
mapUrl = "https://www.openstreetmap.org/?mlat={lat}&mlon={lon}&zoom=15"

# Apple Maps
mapUrl = "https://maps.apple.com/?ll={lat},{lon}"
```

### Environment Variable Override

For more flexibility, you can set the map URL via environment variable in your SvelteKit app. The `PUBLIC_ZONE5_MAP_URL_TEMPLATE` environment variable takes priority over the config file:

```bash
# .env
PUBLIC_ZONE5_MAP_URL_TEMPLATE=https://www.openstreetmap.org/?mlat={lat}&mlon={lon}&zoom=15
```

Priority order:
1. Environment variable `PUBLIC_ZONE5_MAP_URL_TEMPLATE`
2. Config file `[base].mapUrl`
3. Default (Google Earth)

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
