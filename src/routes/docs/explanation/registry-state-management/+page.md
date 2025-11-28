# Registry State Management

How cross-gallery navigation works in Zone5.

---

## The Problem

Consider a page with multiple image galleries:

```svelte
<Zone5 images={landscapePhotos} />

<article>Some content between galleries...</article>

<Zone5 images={portraitPhotos} />
```

Users expect to:
- Open an image from either gallery
- Navigate through **all** images with arrow keys
- See a single lightbox, not one per gallery

This requires galleries to share state.

## The Central Registry

Zone5 solves this with a central registry—a single source of truth for all images on the page.

### What It Tracks

```typescript
type Registry = {
  images: ImageData[];           // All registered images
  current: ImageData | null;     // Currently displayed in lightbox
  currentOffset: number | null;  // Index in images array
  offsets: Map<symbol, {         // Per-component tracking
    start: number;               // Where this component's images start
    count: number;               // How many images from this component
  }>;
};
```

### How Components Interact

1. **Registration**: Each Zone5 component registers its images on mount
2. **Navigation**: Prev/next operate on the combined `images` array
3. **Display**: Lightbox shows the `current` image

## Why Not Component-Local State?

Alternative: each Zone5 component manages its own state.

**Problems**:
- Can't navigate between galleries
- Each gallery needs its own lightbox
- No unified keyboard handling
- Inconsistent URL state

The registry pattern trades simplicity for unified behavior.

## Registration Flow

### Mount

When a Zone5 component mounts:

```typescript
registry.register(componentId, images);
```

This:
1. Adds images to the registry's `images` array
2. Records the offset (start index) and count
3. Uses a `symbol` as the component ID for uniqueness

### Unmount

When a component unmounts:

```typescript
registry.remove(componentId);
```

This removes the component's images and clears its offset tracking.

### Dynamic Content

If a component's images change (reactive update):

```svelte
<script>
  let { images } = $props();
</script>

{#key images}
  <Zone5 {images} />
{/key}
```

The component re-registers with the new images.

## Navigation Implementation

### Setting Current Image

When an image is clicked:

```typescript
registry.setCurrent(componentId, localOffset);
```

The registry:
1. Finds the component's start offset
2. Calculates global index: `start + localOffset`
3. Sets `current` to that image

### Next/Previous

```typescript
registry.next();  // Increment currentOffset, wrap at end
registry.prev();  // Decrement currentOffset, wrap at start
```

The modulo operation ensures wrapping:

```typescript
const mod = (n: number, m: number) => ((n % m) + m) % m;
const newIndex = mod(currentOffset + 1, images.length);
```

## URL Synchronization

### Query Parameter

The lightbox syncs with the URL:

```
?z5=image-abc123
```

### Why This Approach

- **Shareable links**: Users can share specific images
- **Browser history**: Back button closes lightbox
- **Bookmarks**: Save links to favorite images
- **Deep linking**: Navigate directly to an image

### Implementation

Zone5Provider handles URL sync:

```typescript
// On mount: check URL for image ID
const urlId = new URLSearchParams(location.search).get('z5');
if (urlId) {
  registry.findCurrent(urlId);
}

// On current change: update URL
$effect(() => {
  if (current) {
    history.pushState({}, '', `?z5=${current.id}`);
  }
});
```

## The Provider Pattern

### Why a Provider

Zone5Provider wraps content and provides the registry context:

```svelte
<Zone5Provider>
  <Zone5 images={photos} />
  <Zone5Lightbox />
</Zone5Provider>
```

**Benefits**:
- Clear boundary for registry scope
- Multiple independent registries possible
- Lightbox placement flexibility

### Why Not a Global Singleton

A global registry would:
- Share state across unrelated pages
- Make testing harder
- Prevent multiple independent galleries

The provider pattern scopes state to a component tree.

## Svelte Store Implementation

### Current Approach

The registry uses Svelte's `writable` store:

```typescript
const store = writable<{
  images: ImageData[];
  current: ImageData | null;
  currentOffset: number | null;
  offsets: Map<symbol, { start: number; count: number }>;
}>({
  images: [],
  current: null,
  currentOffset: null,
  offsets: new Map(),
});
```

### Readable Interface

The registry exposes a `Readable` interface to consumers:

```typescript
export type Registry = Readable<...> & {
  register: (...) => void;
  setCurrent: (...) => void;
  // etc.
};
```

This prevents direct store modification while allowing subscriptions.

## Trade-offs

### Benefits

- Unified navigation across galleries
- Single lightbox instance
- Consistent keyboard handling
- URL state synchronization

### Costs

- Global state within provider scope
- Registration complexity
- Order-dependent (registration order = navigation order)

### When to Use Multiple Providers

Rare, but possible:

```svelte
<!-- Independent gallery systems -->
<Zone5Provider>
  <Zone5 images={mainGallery} />
  <Zone5Lightbox />
</Zone5Provider>

<Zone5Provider>
  <Zone5 images={sidebarGallery} />
  <Zone5Lightbox />
</Zone5Provider>
```

Each provider has its own registry and lightbox.

## Common Patterns

### Gallery Order

Images appear in navigation order of component rendering:

```svelte
<!-- These images come first in navigation -->
<Zone5 images={firstSet} />

<!-- These images come second -->
<Zone5 images={secondSet} />
```

### Conditional Galleries

Conditionally rendered galleries work correctly:

```svelte
{#if showBonus}
  <Zone5 images={bonusPhotos} />
{/if}
```

When the condition becomes false, images are unregistered.

## Related

- [Architecture Overview](../architecture-overview/) - System design
- [Component Props Reference](../../reference/component-props/) - Component API
- [Keyboard Shortcuts](../../reference/keyboard-shortcuts/) - Navigation controls

