# Keyboard Shortcuts Reference

All keyboard shortcuts for lightbox navigation.

---

## Lightbox Navigation

| Key                | Action                   |
| ------------------ | ------------------------ |
| `←` / `ArrowLeft`  | Previous image           |
| `→` / `ArrowRight` | Next image               |
| `Space`            | Next image               |
| `Escape`           | Close lightbox (or info) |
| `i` / `I`          | Toggle EXIF info overlay |

## Navigation Behavior

### Wrapping

Navigation wraps around:

- Pressing `→` on the last image goes to the first
- Pressing `←` on the first image goes to the last

### Cross-Gallery Navigation

When multiple Zone5 components are on a page, keyboard navigation moves through all registered images in order:

```svelte
<!-- Gallery 1: images 1-5 -->
<Zone5 images={firstGallery} />

<!-- Gallery 2: images 6-10 -->
<Zone5 images={secondGallery} />

<!-- Arrow keys navigate through all 10 images -->
```

## EXIF Info Overlay

Press `i` to open the EXIF info overlay, which displays image metadata:

- **Camera**: Make and model
- **Lens**: Lens model
- **Date**: Capture date and time
- **Settings**: Focal length, aperture, shutter speed, ISO
- **Artist**: Photographer name
- **Copyright**: Copyright information
- **Location**: GPS coordinates (clickable link to map)

### Availability

The info button (`ⓘ`) only appears when the image has EXIF data. Press `i` to toggle the overlay, or `Escape` to close it.

### Escape Key Behavior

When the info overlay is open:
- First `Escape` closes the info overlay
- Second `Escape` closes the lightbox

## Focus Management

### Button Focus

When the lightbox opens, focus moves to the lightbox container. Tab navigation cycles through:

1. Close button
2. Previous button
3. Next button

### Screen Reader Support

Buttons include `aria-label` attributes:

- Close button: "Close lightbox"
- Previous button: "Previous image"
- Next button: "Next image"

## Touch Gestures

On touch devices, the lightbox supports:

| Gesture          | Action         |
| ---------------- | -------------- |
| Tap close button | Close lightbox |
| Tap prev/next    | Navigate       |

Swipe gestures are not currently implemented.

## Mouse Interaction

| Action                  | Result         |
| ----------------------- | -------------- |
| Click outside image     | Close lightbox |
| Click prev/next buttons | Navigate       |
| Click close button      | Close lightbox |

## URL State

Opening an image updates the URL:

```
https://example.com/gallery?z5=abc123
```

This allows:

- Sharing direct links to specific images
- Browser back button closes lightbox
- Bookmarking specific images

## Implementation Details

Keyboard handling is implemented in Zone5Lightbox using Svelte's `onkeydown`:

```svelte
<svelte:window onkeydown={handleKeydown} />
```

The handler checks for:

- `ArrowLeft` → calls `registry.prev()`
- `ArrowRight` → calls `registry.next()`
- `Space` → calls `registry.next()`
- `Escape` → closes info overlay (if open) or lightbox
- `i` / `I` → toggles EXIF info overlay (if EXIF data exists)

## Accessibility Recommendations

### Focus Trap

The lightbox traps focus within its buttons to prevent tabbing to background content.

### Reduced Motion

Users with `prefers-reduced-motion` should see instant transitions:

```css
@media (prefers-reduced-motion: reduce) {
  [data-zone5-lightbox] {
    transition: none;
  }
}
```

## Related

- [Component Props Reference](../component-props/) - Component API
- [Registry State Management](../../explanation/registry-state-management/) - Navigation system
