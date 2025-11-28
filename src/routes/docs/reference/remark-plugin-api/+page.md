# Remark Plugin API Reference

`remarkZ5Images()` remark plugin for markdown image processing.

---

## Import

```typescript
import { remarkZ5Images } from 'zone5/remark';
```

## Function Signature

```typescript
const remarkZ5Images: Plugin
```

The plugin is a unified/remark plugin that requires no configuration.

## Basic Usage

### With mdsvex

```javascript
// svelte.config.js
import { mdsvex } from 'mdsvex';
import { remarkZ5Images } from 'zone5/remark';

const config = {
  extensions: ['.svelte', '.md'],
  preprocess: [
    mdsvex({
      extensions: ['.md'],
      remarkPlugins: [remarkZ5Images]
    })
  ]
};

export default config;
```

## Markdown Syntax

### Single Image

```markdown
![Alt text](./photo.jpg?z5)
```

Generates:

```svelte
<script lang="ts">
import { Zone5 } from 'zone5/components';
import photo from './photo.jpg?z5';
</script>

<Zone5 images={[{...photo, properties: {...photo.properties, alt: "Alt text", title: undefined}}]} />
```

### Multiple Images (Grouped)

Consecutive images on separate lines are grouped into a single gallery:

```markdown
![First photo](./photo1.jpg?z5)
![Second photo](./photo2.jpg?z5)
![Third photo](./photo3.jpg?z5)
```

Generates a single `<Zone5>` component with all three images.

### Images on Same Line

Multiple images on the same line (without blank lines) are also grouped:

```markdown
![Photo 1](./a.jpg?z5)![Photo 2](./b.jpg?z5)
```

### Images with Blank Lines (TODO: Check)

Blank lines between consecutive `?z5` images are ignored—they're still grouped:

```markdown
![Photo 1](./photo1.jpg?z5)

![Photo 2](./photo2.jpg?z5)
```

This becomes a single gallery with two images.

### With Titles

```markdown
![Alt text](./photo.jpg?z5 "Image title")
```

The title becomes `properties.title` in the image data.

### Mixed Content

Non-Zone5 images and other content separate galleries:

```markdown
![Zone5 image](./photo1.jpg?z5)

Some text here breaks the group.

![Another Zone5 image](./photo2.jpg?z5)
```

This creates two separate `<Zone5>` components.

### Regular Images

Images without `?z5` are not processed:

```markdown
![Zone5](./gallery.jpg?z5)
![Regular](./icon.png)
```

Only the first image becomes a Zone5 component.

## Frontmatter Options

### Gallery Mode

Set the gallery mode via frontmatter:

```markdown
---
zone5mode: waterfall
---

![Photo 1](./photo1.jpg?z5)
![Photo 2](./photo2.jpg?z5)
```

Generates:

```svelte
<Zone5 images={[...]} mode="waterfall" />
```

## Generated Output

### Import Key Generation

Import variable names are generated from filenames:

| Filename                 | Import Key |
| ------------------------ | ---------- |
| `photo.jpg`              | `photo`    |
| `my-photo.jpg`           | `my_photo` |
| `123.jpg`                | `_123`     |
| `photo.jpg` (duplicate)  | `photo_1`  |

### Script Injection

The plugin injects a `<script lang="ts">` tag at the top of the markdown file with:

1. Zone5 component import
2. All image imports

## Complete Example

Input markdown:

```markdown
---
title: My Gallery
zone5mode: wall
---

# Photo Gallery

Check out these photos:

![Mountain sunset](./mountain.jpg?z5 "Sunset over the peaks")
![Forest path](./forest.jpg?z5)
![Lake reflection](./lake.jpg?z5)

Regular image below (not processed):

![Icon](./icon.png)
```

Generated output:

```svelte
<script lang="ts">
import { Zone5 } from 'zone5/components';
import mountain from './mountain.jpg?z5';
import forest from './forest.jpg?z5';
import lake from './lake.jpg?z5';
</script>

# Photo Gallery

Check out these photos:

<Zone5 images={[
  {...mountain, properties: {...mountain.properties, alt: "Mountain sunset", title: "Sunset over the peaks"}},
  {...forest, properties: {...forest.properties, alt: "Forest path", title: undefined}},
  {...lake, properties: {...lake.properties, alt: "Lake reflection", title: undefined}}
]} mode="wall" />

Regular image below (not processed):

![Icon](./icon.png)
```

## Limitations

### Script Tag Handling

Currently creates a new `<script>` tag. If your markdown already has a script tag, they won't be merged.

### Supported Elements

Only standard markdown image syntax is supported:

```markdown
![alt](url?z5)           ✓ Supported
![alt](url?z5 "title")   ✓ Supported
<img src="url?z5">       ✗ Not supported (HTML syntax)
```

### Path Resolution

Image paths are relative to the markdown file location.

## Related

- [Getting Started](../../tutorials/getting-started/) - Basic usage
- [Component Props Reference](../component-props/) - Zone5 component API
