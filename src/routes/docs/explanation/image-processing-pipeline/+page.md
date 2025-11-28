# Image Processing Pipeline

Why blurhash, variants, and color extraction matter.

---

## The Problem with Raw Images

Raw photos from cameras are unsuitable for web galleries:

- **File sizes**: A 24MP image is 5-10MB—unacceptable load times
- **Single resolution**: One size can't optimize for all screens
- **No placeholder**: Users see empty space or layout shifts
- **No metadata**: Camera info requires manual extraction

Zone5's processing pipeline solves all of these problems.

## Parallel Processing

When an image is processed, multiple operations run in parallel:

```typescript
const [exifFeature, blurhash, averageColor, variants, metadata] = await Promise.all([
  exifFromFilePath(sourceFile),    // EXIF extraction
  generateBlurhash(sourceFile),     // Placeholder generation
  getDominantColors(sourceFile),    // Color extraction
  generateImageVariants(options),   // Resize to multiple sizes
  sharp(sourceFile).metadata(),     // Dimensions
]);
```

This parallelization significantly reduces processing time—all these operations are I/O-bound and can run concurrently.

## Image Variants

### Why Multiple Sizes

Different devices need different image sizes:

| Device     | Screen Width | Ideal Image Width |
| ---------- | ------------ | ----------------- |
| Mobile     | 375px        | 640-768px         |
| Tablet     | 768px        | 1280px            |
| Laptop     | 1440px       | 1920px            |
| 4K Display | 3840px       | 2560px+           |

Serving a 2560px image to a mobile device wastes bandwidth. Serving a 640px image to a 4K display looks blurry.

### How srcset Works

Zone5 generates a `srcset` attribute with all variants:

```html
<img srcset="
  /@zone5/photo/640.jpg 640w,
  /@zone5/photo/1280.jpg 1280w,
  /@zone5/photo/1920.jpg 1920w
" sizes="(min-width: 1200px) 1200px, 100vw">
```

The browser automatically selects the best variant based on:

- Viewport width
- Device pixel ratio
- CSS sizes attribute

### Trade-off: Storage vs Quality

More variants mean:

- Better optimization for all screen sizes
- Larger cache directory
- Longer initial processing time

Fewer variants mean:

- Smaller storage footprint
- Faster builds
- Some devices get suboptimal images

Default configuration balances these with 5 variants (640, 768, 1280, 1920, 2560).

## Blurhash Generation

### What Blurhash Is

[Blurhash](https://blurha.sh) is a compact representation of an image placeholder:

```
"LEHV6nWB2yk8pyo0adR*.7kCMdnj"
```

This ~28 character string encodes a blurred version of the image that can be decoded to a small canvas.

### Why It's Better Than Solid Color

| Approach    | Size      | Visual Quality         |
| ----------- | --------- | ---------------------- |
| Solid color | 7 bytes   | Poor—just one color    |
| Blurhash    | ~28 bytes | Good—shows composition |
| Thumbnail   | 1-5KB     | Best—but much larger   |

Blurhash provides a good visual preview with minimal data transfer.

### How It Works

1. Image is downscaled and analyzed
2. DCT (discrete cosine transform) encodes color patterns
3. Result is base83 encoded to a string
4. Browser decodes and renders to canvas
5. Canvas shown until real image loads

Zone5 doesn't currently use blurhash in the default components, but the data is available in `properties.blurhash` for custom implementations.

## Color Extraction

### What Gets Extracted

Zone5 extracts the dominant/average color:

```typescript
{
  hex: "#4a7c59",
  rgb: [74, 124, 89]
}
```

### Use Cases

- **Loading state**: Background color while image loads
- **Theming**: Match UI to image colors
- **Placeholders**: Simple colored rectangle

### Implementation

Uses `fast-average-color-node` to analyze the image and return the most representative color. This is shown as the background of Zone5Img while the image loads.

## EXIF Extraction

### What Metadata Is Preserved

| Field           | Example         | Use Case            |
| --------------- | --------------- | ------------------- |
| `make`          | "Canon"         | Display camera info |
| `model`         | "EOS R5"        | Display camera info |
| `lens`          | "RF 24-70mm"    | Display lens info   |
| `exposureTime`  | [1, 125]        | Show settings       |
| `fNumber`       | [8, 1]          | Show settings       |
| `iso`           | 400             | Show settings       |
| `focalLength`   | [50, 1]         | Show settings       |
| `dateTime`      | "2024-06-15..." | Sort, display date  |
| GPS coordinates | [-122, 37]      | Map integration     |

### Camera/Lens Normalization

Raw EXIF contains verbose strings like "Canon EOS R5" that may vary. Zone5 can map these to normalized values (configured in processor options).

## Output Format (ItemFeature)

### Why GeoJSON Structure

Zone5 uses GeoJSON Feature format:

```typescript
{
  type: 'Feature',
  id: 'abc123',
  geometry: { type: 'Point', coordinates: [-122, 37] },
  properties: { /* all metadata */ },
  assets: [ /* variant URLs */ ]
}
```

Benefits:

- **Standard format**: Well-documented, widely understood
- **GPS natural fit**: Geometry property designed for coordinates
- **Extensible**: Properties object holds any metadata
- **Tool compatibility**: Works with mapping libraries directly

### Everything in One Object

All image data is in one importable module:

- Metadata for display
- Assets for rendering
- Location for mapping
- Visual properties for loading states

This simplifies component development—one import gets everything.

## Caching Strategy

### Hash-Based Invalidation

Cache keys are based on:

- Processor config hash
- Relative file path
- File content hash (SHA)

```
.zone5/
└── 1b74f43f-photo-a1b2c3d4/  # hash in directory name
    ├── index.json
    └── variants...
```

### When Reprocessing Occurs

Images are reprocessed when:

- Processor config changes (different hash)
- Source file content changes (different hash)
- Cache is manually cleared
- `forceOverwrite` option is used

Images are NOT reprocessed when:

- File timestamp changes (git clone, etc.)
- Configuration changes (must clear cache)

### Cache Location Flexibility

Configure in `.zone5.toml`:

```toml
[base]
cache = ".zone5"           # Default
cache = "../shared-cache"  # Shared across projects
cache = "/tmp/zone5"       # Temporary
```

## Related

- [Architecture Overview](../architecture-overview/) - How systems connect
- [Caching Strategy](../caching-strategy/) - Cache details
- [ItemFeature Schema](../../reference/itemfeature-schema/) - Output format
