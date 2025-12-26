# Zone5

Image gallery system for SvelteKit with optimized image processing, lightbox functionality, and MDX support.

## Features

- 🖼️ Optimized image processing with variants, blurhash, and color extraction
- 🔍 Lightbox component with keyboard navigation
- 📝 MDX integration for markdown-based galleries
- 🎨 Tailwind CSS 4 support
- ⚡ Vite plugin for automatic image processing
- 🛠️ CLI tool for quick project scaffolding

## CLI Tool

The `zone5` CLI tool helps you quickly create a new SvelteKit gallery project:

```bash
npx zone5 create <input-folder> <output-folder> [options]
```

### Options

- `-m, --mode <type>` - How to handle images: copy, link, or move (default: copy)
- `-p, --package-manager <pm>` - Package manager: npm, pnpm, yarn, bun, or skip (default: npm)
- `--no-interactive` - Skip prompts and use defaults

### Example

```bash
npx zone5 create ./my-photos ./my-gallery --package-manager pnpm
```

## Usage in SvelteKit Projects

### Installation

```bash
npm install zone5
```

### Basic Setup

1. Add the Vite plugin to your `vite.config.ts`:

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { zone5 } from 'zone5/vite';
import { defineConfig } from 'vite';

export default defineConfig({
 plugins: [zone5(), sveltekit()],
});
```

2. Wrap your layout with `Zone5Provider`:

```svelte
<script>
 import { Zone5Provider } from 'zone5/components';
</script>

<Zone5Provider>
 <slot />
</Zone5Provider>
```

3. Create a `.zone5.toml` config file:

```toml
[base]
root = "src/routes"
cache = ".zone5"
namespace = "@zone5"

[processor]
widths = [400, 800, 1200, 1600, 2400]
```

### Using in Components

```svelte
<script>
 import { Zone5 } from 'zone5/components';

 import image1 from './photo1.jpg?z5';
 import image2 from './photo2.jpg?z5';
</script>

<Zone5 images={[image1, image2]} />
```

### Layout Modes

Zone5 supports three layout modes:

#### Justified Mode (Default)

Row-based layout (like Flickr/Google Photos). Each row fills the full width while preserving aspect ratios. Panoramic images (aspect ratio > 3) automatically get their own row.

```svelte
<Zone5 images={images} mode="justified" />

<!-- With custom row height and gap -->
<Zone5
  images={images}
  mode="justified"
  targetRowHeight={250}
  gap={12}
/>
```

#### Wall Mode

Fixed-height grid layout. Images are cropped to fill their containers.

```svelte
<Zone5 images={images} mode="wall" />
```

#### Waterfall Mode

Column-based masonry layout. Images are distributed across columns and maintain their aspect ratios.

```svelte
<Zone5 images={images} mode="waterfall" />

<!-- With custom column breakpoints -->
<Zone5
  images={images}
  mode="waterfall"
  columnBreakpoints={{ 640: 2, 1024: 4 }}
/>
```

### Setting Mode in Markdown

Use the `zone5mode` frontmatter property:

```markdown
---
zone5mode: justified
---

![Photo 1](./photo1.jpg?z5)
![Photo 2](./photo2.jpg?z5)
```

Valid values: `wall`, `waterfall`, `justified`

### Using in Markdown/MDX

Add the remark plugin to your `svelte.config.js`:

```javascript
import { remarkZ5Images } from 'zone5/remark';
import { mdsvex } from 'mdsvex';

export default {
 preprocess: [
  mdsvex({
   extensions: ['.md'],
   remarkPlugins: [remarkZ5Images],
  }),
 ],
};
```

Then simply reference images with the `?z5` query parameter:

```markdown
![Mountain view](./mountains.jpg?z5)
![Beach sunset](./beach.jpg?z5)
```

## Development

### Prerequisites

- Node.js 18+
- pnpm (recommended package manager)

### Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run tests in watch mode
pnpm test --watch

# Type check
pnpm check
```

### Project Structure

```
src/
├── lib/                    # Main library code
│   ├── components/         # Svelte components
│   ├── processor/          # Image processing pipeline
│   ├── vite.ts            # Vite plugin
│   ├── remark.ts          # Remark MDX plugin
│   └── config.ts          # Configuration loader
├── cli/                   # CLI tool
└── routes/                # Demo/documentation site
```

### Testing

The project uses a comprehensive test suite organized by purpose:

#### `pnpm test` - Unit Tests (⚡ ~2.7s)

Fast unit tests for core functionality:

- Component tests (portal)
- Processor tests (blurhash, color, variants, exif)
- Remark plugin tests

**Use this during development** for quick feedback on code changes.

To run a single test file:

```bash
pnpm vitest src/lib/processor/blurhash.test.ts
```

#### `pnpm test:ui` - Integration UI Tests

Playwright tests on the local project (currently placeholder for future tests).

#### `pnpm test:cli` - CLI Integration Tests (~47.8s)

Integration tests for CLI functionality:

- Project creation and configuration
- Package manager support (npm, pnpm, yarn, bun)
- Template file generation
- Utility functions

**Run this before committing** CLI-related changes.

#### `pnpm test:e2e` - End-to-End Tests (~24.1s)

Playwright E2E tests that validate the complete workflow:

- Creates a new project using the CLI
- Builds the generated project
- Tests the lightbox UI functionality
- Validates Tailwind CSS integration

**Run this to verify** the complete user experience.

#### `pnpm test:all` - All Tests (~74.6s)

Runs all test suites in sequence: unit → CLI → E2E.

**Run this before releases** to ensure everything works together.

### Build Commands

```bash
pnpm dev           # Watch mode for development (full demo site)
pnpm build         # Build the package (runs svelte-package + CLI build + publint)
pnpm build:cli     # Build just the CLI tool
pnpm build:watch   # Build the package in watch mode
pnpm check         # Type checking with svelte-check
pnpm check:watch   # Type checking in watch mode
pnpm lint          # Run ESLint
```

### Architecture Overview

Zone5 consists of four main components:

1. **Image Processor** (`src/lib/processor/`) - Uses Sharp to generate image variants, extract EXIF data, create blurhashes, and determine dominant colors. Results are cached in `.zone5/` directory.

2. **Vite Plugin** (`src/lib/vite.ts`) - Intercepts `.jpg?z5` imports at build time, processes images, and serves them during development.

3. **Remark Plugin** (`src/lib/remark.ts`) - Transforms markdown images with `?z5` query parameters into Zone5 Svelte components.

4. **Component System** (`src/lib/components/`) - Svelte 5 components with a centralized registry for managing lightbox state and navigation across multiple galleries.

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation.

### Contributing

1. Make your changes
2. Run `pnpm test` to ensure unit tests pass
3. Run `pnpm check` to verify types
4. Run `pnpm lint` to check code style
5. If you changed the CLI, run `pnpm test:cli`
6. Before submitting, run `pnpm test:all` to validate everything

**Commit Messages:**

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Commit messages are validated via Husky hooks.

Format: `<type>: <description>`

Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:

- `feat: add lightbox keyboard navigation`
- `fix: resolve EXIF parsing error`
- `docs: update installation instructions`

## License

MIT
