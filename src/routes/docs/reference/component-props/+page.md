# Component Props Reference

All props for Zone5 Svelte components.

---

## Zone5Provider

Root component that provides context for lightbox functionality.

### Props

| Prop       | Type      | Default    | Description             |
| ---------- | --------- | ---------- | ----------------------- |
| `children` | `Snippet` | (required) | Child content to render |

### Context

Provides an image registry context that:

- Tracks all registered images across galleries
- Manages current lightbox image
- Handles URL state synchronization (`?z5=<image-id>`)
- Provides navigation functions

### Usage

```svelte
<script>
  import { Zone5Provider } from 'zone5/components';
</script>

<Zone5Provider>
  <slot />
</Zone5Provider>
```

Place in your root `+layout.svelte` to enable lightbox across all pages.

---

## Zone5

Main gallery component that displays images and registers them with the lightbox.

### Props

| Prop                | Type                                      | Default                       | Description                                              |
| ------------------- | ----------------------------------------- | ----------------------------- | -------------------------------------------------------- |
| `images`            | `ImageData[]`                             | (required)                    | Array of image data objects                              |
| `mode`              | `'wall' \| 'waterfall' \| 'justified'`    | `'wall'`                      | Gallery layout mode                                      |
| `columnBreakpoints` | `{ [width: number]: number }`             | `{ 640: 2, 768: 3, 1024: 4 }` | Viewport width to column count mapping (waterfall mode)  |
| `targetRowHeight`   | `number`                                  | `300`                         | Target row height in pixels (justified mode)             |
| `gap`               | `number`                                  | `8`                           | Gap between images in pixels (justified mode)            |
| `nocaption`         | `boolean`                                 | `false`                       | Hide image captions                                      |

### Layout Modes

- **`wall`** - Fixed-height row layout. Single images display centered; multiple images in a horizontal row with cropping.
- **`waterfall`** - Column-based masonry layout. Images are distributed across columns and maintain their aspect ratios.
- **`justified`** - Row-based layout (like Flickr/Google Photos). Each row fills full width while preserving aspect ratios. Panoramic images (aspect ratio > 3) automatically get their own row.

Note: When using mdsvex with the Zone5 plugin, the mode can be set in the markdown YAML frontmatter, using the `zone5mode` key.

### Usage

```svelte
<script>
  import { Zone5 } from 'zone5/components';
  import photo1 from './images/photo1.jpg?z5';
  import photo2 from './images/photo2.jpg?z5';

  const images = [
    { ...photo1, properties: { ...photo1.properties, alt: 'First photo' } },
    { ...photo2, properties: { ...photo2.properties, alt: 'Second photo' } },
  ];
</script>

<Zone5 {images} />
```

### Waterfall Mode Example

```svelte
<Zone5
  {images}
  mode="waterfall"
  columnBreakpoints={{ 640: 2, 1024: 3, 1280: 4 }}
/>
```

### Justified Mode Example

```svelte
<Zone5
  {images}
  mode="justified"
  targetRowHeight={250}
  gap={12}
/>
```

---

## Zone5Img

Individual image component with lazy loading and click handling.

### Props

| Prop      | Type         | Default      | Description                          |
| --------- | ------------ | ------------ | ------------------------------------ |
| `image`   | `ImageData`  | (required)   | Image data object                    |
| `class`   | `string`     | `undefined`  | Additional CSS classes               |
| `cover`   | `boolean`    | `false`      | Use `object-cover` for image fitting |
| `onclick` | `() => void` | `undefined`  | Click handler                        |

### Behavior

- Generates responsive `srcset` from image assets
- Shows average color background while loading
- Fades in when loaded
- Adds `cursor-pointer` and keyboard support when `onclick` is provided

### Usage

```svelte
<script>
  import { Zone5Img } from 'zone5/components';
  import photo from './photo.jpg?z5';

  const image = {
    ...photo,
    properties: { ...photo.properties, alt: 'My photo' }
  };
</script>

<Zone5Img {image} class="rounded-lg" />
```

---

## Zone5Lightbox

Full-screen modal lightbox for viewing images.

### Props

| Prop                 | Type         | Default      | Description                            |
| -------------------- | ------------ | ------------ | -------------------------------------- |
| `image`              | `ImageData`  | `undefined`  | Current image to display               |
| `force`              | `boolean`    | `false`      | Force lightbox open even without image |
| `onclose`            | `() => void` | (required)   | Called when lightbox should close      |
| `onprevious`         | `() => void` | `undefined`  | Called for previous image navigation   |
| `onnext`             | `() => void` | `undefined`  | Called for next image navigation       |
| `transitionDuration` | `number`     | `300`        | Transition duration in milliseconds    |

### Keyboard Shortcuts

| Key          | Action         |
| ------------ | -------------- |
| `Escape`     | Close lightbox |
| `ArrowLeft`  | Previous image |
| `ArrowRight` | Next image     |
| `Space`      | Next image     |

### Usage

Typically used automatically via `Zone5Provider`. For manual control:

```svelte
<script>
  import { Zone5Lightbox } from 'zone5/components';

  let currentImage = $state(undefined);
</script>

<Zone5Lightbox
  image={currentImage}
  onclose={() => currentImage = undefined}
  onprevious={() => { /* navigate to previous */ }}
  onnext={() => { /* navigate to next */ }}
/>
```

---

## Atom Components

Lower-level button components for custom implementations.

### CloseButton

```svelte
<script>
  import { CloseButton } from 'zone5/components/atoms';
</script>

<CloseButton
  class="absolute top-4 right-4"
  onclose={() => { /* handle close */ }}
/>
```

### PrevButton / NextButton

```svelte
<script>
  import { PrevButton, NextButton } from 'zone5/components/atoms';
</script>

<PrevButton
  onprevious={() => { /* handle previous */ }}
  disabled={isFirst}
/>

<NextButton
  onnext={() => { /* handle next */ }}
  disabled={isLast}
/>
```

---

## TypeScript Types

### ImageData

```typescript
interface ImageData {
  type: 'Feature';
  id: string;
  geometry: { type: 'Point'; coordinates: [number, number] } | null;
  properties: {
    // EXIF metadata
    make?: string;
    model?: string;
    dateTime?: string;
    artist?: string;
    copyright?: string;
    exposureTime?: [number, number];
    fNumber?: [number, number];
    iso?: number;
    focalLength?: [number, number];
    lens?: string;

    // Visual properties
    aspectRatio: number;
    blurhash: string;
    averageColor: { hex: string; rgb: [number, number, number] };

    // Display properties
    alt: string;
    title?: string;
  };
  assets: Array<{ href: string; width: number }>;
}
```

---

## Related

- [ItemFeature Schema](../itemfeature-schema/) - Full schema documentation
- [Keyboard Shortcuts](../keyboard-shortcuts/) - All keyboard controls
