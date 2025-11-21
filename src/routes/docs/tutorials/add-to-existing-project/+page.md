# Add Zone5 to an Existing Project

Step-by-step integration of Zone5 into an existing SvelteKit application.

---

## What You'll Accomplish

By the end of this tutorial, your existing SvelteKit project will have:

- Zone5 image processing configured
- A gallery page with lightbox functionality
- Responsive image loading with blurhash placeholders

## Prerequisites

- **Existing SvelteKit project** - If you don't have one, run `npx sv create my-app`
- **Node.js 18+**
- **Images to add** - JPG files in your project

## Step 1: Install Zone5

Install Zone5 and its peer dependencies:

```bash
npm install zone5 @lucide/svelte
```

Zone5 also requires Tailwind CSS 4. If not already installed:

```bash
npm install -D tailwindcss @tailwindcss/vite
```

## Step 2: Add the Vite Plugin

Edit your `vite.config.ts` to add the Zone5 plugin:

```typescript
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { zone5 } from 'zone5/vite';

export default defineConfig({
  plugins: [
    zone5(),      // Must come before sveltekit()
    tailwindcss(),
    sveltekit()
  ]
});
```

**Important**: The `zone5()` plugin must be listed before `sveltekit()` to properly intercept image imports.

## Step 3: Create Configuration File (Optional)

Create `.zone5.toml` in your project root:

```toml
[base]
root = "static/images"
cache = ".zone5"
namespace = "@zone5"

[processor]
variants = [640, 768, 1280, 1920, 2560]
```

Adjust `root` to match where your images are stored.

## Step 4: Add Zone5Provider to Layout

Edit `src/routes/+layout.svelte` to wrap your app with Zone5Provider:

```svelte
<script>
  import { Zone5Provider } from 'zone5/components';
  import '../app.css';

  let { children } = $props();
</script>

<Zone5Provider>
  {@render children()}
</Zone5Provider>
```

This enables the lightbox functionality across all pages.

## Step 5: Create a Gallery Page

Create a new route at `src/routes/gallery/+page.svelte`:

```svelte
<script>
  import { Zone5 } from 'zone5/components';

  // Import images with ?z5 suffix
  import photo1 from '$lib/images/photo1.jpg?z5';
  import photo2 from '$lib/images/photo2.jpg?z5';
  import photo3 from '$lib/images/photo3.jpg?z5';

  // Add alt text for accessibility
  const images = [
    { ...photo1, properties: { ...photo1.properties, alt: 'Mountain landscape' } },
    { ...photo2, properties: { ...photo2.properties, alt: 'Forest path' } },
    { ...photo3, properties: { ...photo3.properties, alt: 'Lake at sunset' } },
  ];
</script>

<h1>My Gallery</h1>
<Zone5 {images} />
```

Make sure your images exist at the paths you're importing from.

## Step 6: Verify It Works

Start the development server:

```bash
npm run dev
```

Navigate to `http://localhost:5173/gallery`. You should see:

1. Your images displayed in a grid
2. Colored placeholders that fade to the actual images
3. Clicking an image opens the lightbox

![Zone 5 gallery](../../zone5.jpg?z5)

Test the lightbox:

- Click an image to open
- Use arrow keys to navigate
- Press Escape to close

## Optional, but recommended: Add MDX Support

For markdown-based galleries, add mdsvex support.

### Install mdsvex

```bash
npm install -D mdsvex
```

### Configure svelte.config.js

```javascript
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { remarkZ5Images } from 'zone5/remark';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', '.md'],
  preprocess: [
    vitePreprocess(),
    mdsvex({
      extensions: ['.md'],
      remarkPlugins: [remarkZ5Images]
    })
  ],
  kit: {
    adapter: adapter()
  }
};

export default config;
```

### Create a Markdown Gallery

Create `src/routes/photos/+page.md`:

```markdown
# My Photos

Here are some photos from my trip:

![Mountain view](../lib/images/mountain.jpg?z5)
![Valley panorama](../lib/images/valley.jpg?z5)
![Sunset over lake](../lib/images/sunset.jpg?z5)

These images are automatically grouped into a gallery!
```

## Troubleshooting

### Images Not Processing

- Verify the image path is correct
- Check that `?z5` suffix is included
- Ensure `.zone5.toml` has the correct `root` path

### Lightbox Not Working

- Confirm `Zone5Provider` wraps your content in `+layout.svelte`
- Check browser console for errors

### Build Errors

- Ensure `zone5()` plugin is before `sveltekit()` in vite.config.ts
- Clear the cache: delete `.zone5/` directory and restart dev server

### TypeScript Errors

Add type declarations for `?z5` imports in `src/app.d.ts`:

```typescript
declare module '*?z5' {
  import type { ItemFeature } from 'zone5';
  const value: ItemFeature;
  export default value;
}
```

## Next Steps

Your project now has Zone5 integrated! Continue with:

- [Customize Image Variants](../how-to/customize-image-variants/) - Optimize image sizes
- [Configuration Reference](../reference/configuration/) - All config options
