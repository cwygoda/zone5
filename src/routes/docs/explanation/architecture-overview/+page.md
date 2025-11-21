# Architecture Overview

How the four main systems in Zone5 work together.

---

## The Four Pillars

Zone5 is built on four interconnected systems:

1. **Image Processor** - Transforms raw images into optimized variants
2. **Vite Plugin** - Intercepts imports and triggers processing
3. **Remark Plugin** - Transforms markdown into gallery components
4. **Component System** - Renders galleries and manages state

Each system has a specific role, and they work together through shared configuration and the cache directory.

## Data Flow

```
Source Image (.jpg)
       ↓
   Vite Plugin (intercepts ?z5 import)
       ↓
   Image Processor
       ↓
   Cache (.zone5/)
   ├── variants (640.jpg, 1280.jpg, ...)
   └── metadata (index.json)
       ↓
   ES Module (ItemFeature)
       ↓
   Component (Zone5, Zone5Img)
       ↓
   Browser (responsive images + lightbox)
```

**Build-time**: Image processing, variant generation, metadata extraction

**Runtime**: Component rendering, lightbox interaction, image loading

## Image Processor

The processor takes raw images and produces everything needed for display.

### What It Does

- Generates multiple size variants using Sharp
- Extracts EXIF metadata (camera, lens, GPS)
- Creates blurhash placeholder strings
- Extracts dominant color for loading state
- Outputs GeoJSON-structured ItemFeature

### Why Sharp

Sharp was chosen for image processing because:

- Fast native bindings (libvips)
- Excellent quality with multiple resize kernels
- Wide format support
- Active maintenance and community

### Why GeoJSON

The ItemFeature format follows GeoJSON because:

- Natural fit for GPS coordinates
- Extensible properties object for metadata
- Compatible with mapping libraries
- Well-defined, widely-understood specification

## Vite Plugin

The Vite plugin is the coordination layer that triggers processing and serves assets.

### What It Does

- Detects `?z5` query parameters on imports
- Triggers the processor for uncached images
- Generates ES modules from ItemFeature JSON
- Serves processed images in development
- Copies cache to build output

### Why Build-Time

Processing happens at build time rather than runtime because:

- **Performance**: No server-side processing latency
- **Cost**: Static hosting is cheaper than compute
- **Reliability**: No runtime dependencies or failures
- **CDN-friendly**: All assets can be edge-cached

The trade-off is slower builds, but the cache mitigates this for incremental changes.

## Remark Plugin

The remark plugin enables markdown-based galleries without writing component code.

### What It Does

- Finds images with `?z5` in markdown
- Groups consecutive images into galleries
- Generates import statements
- Creates Zone5 component calls
- Injects script tag with imports

### How It Fits with mdsvex

The plugin runs as part of the markdown processing pipeline:

```
Markdown → Remark (remarkZ5Images) → mdsvex → Svelte Component
```

This allows users to write standard markdown while getting fully-featured galleries.

## Component System

The component system handles rendering and user interaction.

### Registry Pattern

A central registry tracks all images across all Zone5 components on a page:

- **Registration**: Each Zone5 component registers its images on mount
- **Navigation**: Prev/next works across all registered images
- **Lightbox**: Single lightbox instance shows the current image
- **URL sync**: `?z5=<id>` query parameter for shareable links

### Why Central Registry

Alternative approaches were considered:

- **Per-component state**: Would require separate lightbox per gallery
- **Global store**: Less flexible for component isolation
- **Context + registry**: Chosen for balance of simplicity and flexibility

The registry allows multiple galleries to behave as one seamless collection.

## How They Connect

### Shared Configuration

All systems read from `.zone5.toml`:

- Processor uses `variants`, `resize_kernel`
- Vite plugin uses `cache`, `namespace`
- Components use assets URLs based on `namespace`

### Cache as the Bridge

The `.zone5/` directory bridges build-time and runtime:

- Processor writes variants and metadata
- Vite plugin reads and serves from cache
- Build copies cache to output directory

### Type Safety

TypeScript types flow through the system:

- `ItemFeature` defined in processor
- Used by Vite plugin module generation
- Extended to `ImageData` for components
- Ensures consistency from processing to rendering

## Design Decisions and Trade-offs

### Build-Time Processing

**Benefit**: Fast page loads, simple deployment, CDN-friendly

**Cost**: Slower builds, more disk space

**Mitigation**: Hash-based caching for incremental builds

### Central Registry

**Benefit**: Simple cross-gallery navigation, single lightbox

**Cost**: Global state, components must be within provider

**Mitigation**: Clear provider pattern, automatic registration

### GeoJSON Format

**Benefit**: Future mapping features, standard format

**Cost**: Slightly more complex structure

**Mitigation**: Type definitions make access straightforward

## Extension Points

Where you can customize:

- **Styling**: CSS targeting data attributes
- **Layout**: `mode` prop for gallery arrangement
- **Display**: Access ItemFeature properties directly
- **Processing**: Configure variants, kernels, gamma

What's meant to be stable:

- ItemFeature schema
- Component prop interfaces
- Plugin configuration options

## Related

- [Image Processing Pipeline](./image-processing-pipeline/) - Processing details
- [Registry State Management](./registry-state-management/) - Component state
