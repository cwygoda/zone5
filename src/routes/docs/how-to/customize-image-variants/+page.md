# Customize Image Variants

Configure image widths and resize settings for your gallery.

---

## Problem

The default variant widths (640, 768, 1280, 1920, 2560px) may not match your needs. You might want:

- Fewer variants for smaller bundle sizes
- Different sizes for your target devices
- Better quality for retina displays

## Configure Variant Widths

Edit `.zone5.toml` to set custom widths:

```toml
[processor]
variants = [400, 800, 1200, 1600]
```

### Common Patterns

#### Mobile-First (Smaller Files)

```toml
[processor]
variants = [320, 640, 1024, 1440]
```

Good for blogs and content sites where most traffic is mobile.

#### High-Resolution Focus

```toml
[processor]
variants = [768, 1536, 2304, 3072]
```

For photography portfolios targeting retina displays.

#### Minimal Variants

```toml
[processor]
variants = [640, 1280, 2560]
```

Reduces processing time and storage at the cost of some optimization.

## Configure Resize Quality

Adjust the resize kernel for quality vs. speed:

```toml
[processor]
resize_kernel = "lanczos3"
resize_gamma = 2.2
```

### Available Kernels

| Kernel     | Quality | Speed   |
| ---------- | ------- | ------- |
| `nearest`  | Low     | Fastest |
| `cubic`    | Medium  | Fast    |
| `mitchell` | Good    | Medium  |
| `lanczos2` | High    | Slower  |
| `lanczos3` | Highest | Slowest |
| `mks2013`  | High    | Medium  |
| `mks2021`  | High    | Medium  |

### Gamma Correction

Gamma correction can convert images to linear light space before resizing, which can produce crisper details, especially on high-contrast edges. By default, no gamma correction is applied.

```toml
[processor]
resize_gamma = 2.2  # resize in linear light for crisp details (recommended for photos)
# Omit resize_gamma to resize in sRGB gamma space (default, faster)
```

## Clear and Regenerate Cache

After changing configuration, it's recommended to clear the cache to remove old
files:

```bash
rm -rf .zone5
npm run dev
```

The cache will rebuild with new settings on the next request.

## Verify Changes

### Check Generated Files

Look in `.zone5/` to see the generated variants:

```bash
ls -la .zone5/1b74f43f-photo-abc123/
```

You should see one file per configured width.

### Test Responsive Behavior

1. Open your gallery in the browser
2. Open DevTools → Network tab
3. Filter by "Img"
4. Resize the browser window
5. Verify the browser loads appropriate sizes

### Inspect srcset

In DevTools Elements panel, check the `srcset` attribute:

```html
<img srcset="
  /@zone5/photo-abc123/400.jpg 400w,
  /@zone5/photo-abc123/800.jpg 800w,
  /@zone5/photo-abc123/1200.jpg 1200w
" ...>
```

## Size vs. Quality Trade-offs

| More Variants                            | Fewer Variants       |
| ---------------------------------------- | -------------------- |
| Better optimization for all screen sizes | Smaller build output |
| Larger cache directory                   | Faster build times   |
| More processing time                     | Less optimal loading |

### Recommended Starting Points

- **Blog/Content site**: 4 variants, 400-1600px
- **Photography portfolio**: 5 variants, 640-2560px
- **Mobile app webview**: 3 variants, 320-1280px

## Related

- [Configuration Reference](../../reference/configuration/) - All config options
- [Image Processing Pipeline](../../explanation/image-processing-pipeline/) - How variants work
