# Zone5 Documentation

Build optimized image galleries for SvelteKit with automatic processing, lightbox, and EXIF metadata.

---

## Getting Started

New to Zone5? Start here:

- [Getting Started Tutorial](./tutorials/getting-started) - Create your first gallery in 5 minutes
- [Add to Existing Project](./tutorials/add-to-existing-project) - Integrate Zone5 into a SvelteKit app

## How-To Guides

Task-oriented guides for common needs:

### Configuration

- [Customize Image Variants](./how-to/customize-image-variants) - Adjust sizes for your use case
- [Configure Caching](./how-to/configure-caching) - Optimize build performance
- [Use Different Package Managers](./how-to/use-different-package-managers) - npm, pnpm, yarn, bun

<!--
### Styling
-->

## Reference

Complete API documentation:

### Core

- [Configuration](./reference/configuration) - `.zone5.toml` options
- [Component Props](./reference/component-props) - Zone5, Zone5Img, Zone5Lightbox props
- [CLI Commands](./reference/cli-commands) - `zone5 create` command

### Plugins

- [Vite Plugin API](./reference/vite-plugin-api) - Build-time processing
- [Remark Plugin API](./reference/remark-plugin-api) - Markdown image transformation

### Data

- [ItemFeature Schema](./reference/itemfeature-schema) - GeoJSON output format
- [Package Exports](./reference/package-exports) - Import paths

### UI

- [Keyboard Shortcuts](./reference/keyboard-shortcuts) - Lightbox navigation

## Explanation

Understand the design and architecture:

### Architecture

- [Architecture Overview](./explanation/architecture-overview) - How the four systems connect
- [Image Processing Pipeline](./explanation/image-processing-pipeline) - Variants, blurhash, EXIF

### Design Decisions

- [GeoJSON Format Choice](./explanation/geojson-format-choice) - Why ItemFeature uses GeoJSON
- [Caching Strategy](./explanation/caching-strategy) - Hash-based invalidation

### Implementation

- [Registry State Management](./explanation/registry-state-management) - Cross-gallery navigation
- [Vite Module Resolution](./explanation/vite-module-resolution) - Virtual modules and `?z5`

## Quick Links

### Installation

```bash
# Create a new project
npx zone5 create my-gallery --input ~/photos

# Or add to existing project
npm install zone5
```

### Basic Usage

```svelte
<script>
  import { Zone5, Zone5Provider, Zone5Lightbox } from 'zone5/components';
  import photo from './photo.jpg?z5';
</script>

<Zone5Provider>
  <Zone5 images={[photo]} />
  <Zone5Lightbox />
</Zone5Provider>
```

### Configuration

```toml
# .zone5.toml
[processor]
widths = [640, 768, 1280, 1920, 2560]
```
