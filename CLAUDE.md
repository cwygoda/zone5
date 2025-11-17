# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Zone5 is a SvelteKit image gallery system that provides optimized image processing with blurhash, color extraction, lightbox functionality, and MDX/markdown integration. It consists of three main systems:

1. **Svelte Components** - Gallery UI components with lightbox
2. **Image Processor** - Sharp-based image optimization pipeline
3. **CLI Tool** - Project scaffolding utility
4. **Build-time Plugins** - Vite plugin and Remark plugin for automatic image processing

## Commands

### Development

```bash
pnpm dev          # Watch mode for development - full site
pnpm build        # Build the package (runs svelte-package + CLI build + publint)
pnpm build:cli    # Build just the CLI tool
pnpm build:watch  # Build the package in watch mode
pnpm check        # Type checking with svelte-check
pnpm lint         # Run ESLint
```

### Commit Message Convention

The project uses [Conventional Commits](https://www.conventionalcommits.org/) enforced via Husky hooks:

- **Pre-commit hook**: Runs `pnpm lint` and `pnpm test` before allowing commits
- **Commit-msg hook**: Validates commit message format using commitlint

**Valid commit format**: `<type>: <description>`

**Valid types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `revert`

**Examples**:

- `feat: add blurhash generation to processor`
- `fix: resolve type error in Zone5Provider`
- `docs: update CLAUDE.md with commit guidelines`
- `refactor: simplify registry state management`

### Testing Strategy

The project has four distinct test suites organized by purpose:

```bash
pnpm test         # Unit tests (~2.7s) - Use during development
pnpm test:cli     # CLI integration tests (~47.8s) - Run before committing CLI changes
pnpm test:e2e     # E2E tests (~24.1s) - Validates complete workflow
pnpm test:ui      # UI integration tests (placeholder)
pnpm test:all     # All tests (~74.6s) - Run before releases
```

**Testing Guidelines:**

- Run `pnpm test` frequently during development for fast feedback
- Run `pnpm test:cli` before committing CLI-related changes
- Run `pnpm test:e2e` to verify the complete user experience
- Run `pnpm test:all` before releases to ensure everything works together
- To run a single test file: `pnpm vitest src/path/to/file.test.ts`
- To run a single test in watch mode: `pnpm vitest src/path/to/file.test.ts --watch`

## Architecture

### Image Processing Pipeline

The core processing happens in `src/lib/processor/index.ts`. When an image is processed:

1. **Input**: Source image file path + configuration
2. **Parallel Processing**: Extracts EXIF data, generates blurhash, extracts dominant colors, and creates image variants (different sizes)
3. **Output**: JSON feature file (GeoJSON format) containing all metadata + variant assets
4. **Caching**: Results stored in `.zone5/` directory, keyed by source file hash

The processor generates an `ItemFeature` object that combines:

- GeoJSON geometry (from GPS EXIF data if available)
- EXIF metadata (camera, lens, exposure, etc.)
- Visual properties (aspect ratio, blurhash, dominant color)
- Asset variants (URLs for different image sizes)

### Vite Plugin Flow

The Vite plugin (`src/lib/vite.ts`) enables automatic processing of images at build time:

1. **Image Import**: When a `.jpg?z5` query parameter is detected, the plugin intercepts the module resolution
2. **Processing**: Calls the processor to generate/retrieve cached metadata
3. **Module Generation**: Converts the JSON feature to an ES module using `@rollup/pluginutils`
4. **Asset Serving**: Sets up middleware to serve processed images from cache during dev/preview
5. **Build Output**: Copies processed images to the build directory

The plugin uses OpenTelemetry tracing for performance monitoring.

### Remark Plugin for MDX

The Remark plugin (`src/lib/remark.ts`) transforms markdown images into Zone5 components:

1. **Detection**: Finds images with `?z5` query parameter in markdown
2. **Grouping**: Groups consecutive images (with or without blank lines between them)
3. **Import Generation**: Creates ES module imports for each image
4. **Component Generation**: Replaces image markdown with `<Zone5>` Svelte components
5. **Script Injection**: Injects import statements at the top of the markdown file

This allows users to write simple markdown like:

```md
![Alt text](./image.jpg?z5)
![Another image](./image2.jpg?z5)
```

And it automatically becomes a Zone5 gallery component.

### Component State Management

The component system uses a centralized registry (`src/lib/stores/registry.svelte.ts`) for managing image state:

- **Zone5Provider**: Root component that provides context and manages the global registry
- **Zone5**: Gallery component that registers images with the registry
- **Zone5Img**: Individual image component
- **Zone5Lightbox**: Modal lightbox that displays the current image from registry

The registry tracks:

- All registered images across all gallery components on the page
- Current image being viewed in the lightbox
- Image offsets per component for navigation
- URL state synchronization (via `?z5=<image-id>` query parameter)

Navigation (prev/next) works across all galleries on the page, treating them as one continuous collection.

### Configuration System

Configuration is loaded from `.zone5.toml` files using zod schemas:

```toml
[base]
root = "."           # Source image directory
cache = ".zone5"     # Processed image cache directory
namespace = "@zone5" # URL namespace for serving images

[processor]
# Image variant widths to generate
widths = [400, 800, 1200, 1600, 2400]
```

The `src/lib/config.ts` module walks up the directory tree to find the config file.

### CLI Architecture

The CLI (`src/cli/`) creates new SvelteKit projects with Zone5 pre-configured:

1. Creates project structure from templates (`src/cli/templates/`)
2. Copies/links/moves images from input folder
3. Generates `.zone5.toml` config
4. Installs dependencies using specified package manager
5. Creates a sample markdown page with the gallery

## Key Technical Details

- **Module Resolution**: The Vite plugin uses `\0` prefix for virtual modules (standard Rollup convention)
- **Image Variants**: Generated using Sharp with optimized JPEG settings
- **Blurhash**: Compact representation of placeholder images (decodes to blurred preview)
- **EXIF Parsing**: Uses `exifr` library with custom converters for camera/lens data
- **Portal Pattern**: Components like the lightbox use a portal to render outside the DOM hierarchy
- **URL State**: Lightbox state is synchronized with URL query parameters for shareable links
- **OpenTelemetry**: Performance instrumentation using OpenTelemetry API for observability

## Package Exports

The package provides multiple entry points:

- `.` - Main entry (config + processor + types)
- `./components` - Svelte components (Zone5, Zone5Provider, Zone5Img, Zone5Lightbox)
- `./components/atoms` - Lower-level button components
- `./vite` - Vite plugin
- `./remark` - Remark plugin for markdown processing

## Important Patterns

- **Svelte 5 Runes**: Uses `$state`, `$props`, `$effect` instead of legacy syntax
- **TypeScript Strict Mode**: Enabled with allowImportingTsExtensions
- **Test Organization**: Tests are co-located with source files (`.test.ts` or `.spec.ts`)
- **Hash-based Caching**: Uses relative path + content hash for cache keys to detect source changes
