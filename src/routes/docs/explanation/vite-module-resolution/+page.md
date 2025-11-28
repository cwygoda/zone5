# Vite Module Resolution

Virtual modules and the `\0` prefix convention.

---

## How Vite Resolves Imports

When you write:

```typescript
import photo from './sunset.jpg?z5';
```

Vite processes this through plugin hooks:

1. **`resolveId`** - Determine what module ID to use
2. **`load`** - Provide the module content
3. **`transform`** - Modify the content (optional)

Zone5's Vite plugin implements these hooks to intercept `?z5` imports.

## The ?z5 Query Parameter

### Detection

The plugin checks for the `?z5` query:

```typescript
resolveId(id) {
  if (id.includes('?z5')) {
    // Handle this import
  }
}
```

### Why Query Parameter

Alternative approaches:

| Approach          | Example          | Issue                 |
| ----------------- | ---------------- | --------------------- |
| Custom extension  | `photo.z5`       | File doesn't exist    |
| Prefix            | `z5:./photo.jpg` | Non-standard          |
| Query parameter   | `photo.jpg?z5`   | Works with real files |

The query parameter approach:

- Keeps the original file path valid
- Follows Vite conventions (like `?raw`, `?url`)
- Allows IDE features to work (go-to-file, etc.)

## Virtual Modules

### What They Are

A virtual module is content that exists only in memory, not on disk:

```typescript
// This "file" doesn't exist on disk
import data from '\0zone5:processed-photo-abc123';
```

Vite generates it on-demand from the processed image data.

### When Zone5 Uses Them

1. User imports `./photo.jpg?z5`
2. Plugin resolves to `\0zone5:/path/to/photo.jpg`
3. Plugin loads the virtual module with ItemFeature data

### Why Not Just Return JSON

The plugin could return JSON directly:

```typescript
load(id) {
  return JSON.stringify(itemFeature);
}
```

But ES modules offer benefits:

- Tree shaking
- Type information
- Standard import syntax

## The \0 Prefix Convention

### What It Means

The `\0` (null character) prefix is a Rollup/Vite convention signaling "this is not a real file."

```typescript
resolveId(id) {
  if (id.includes('?z5')) {
    return `\0zone5:${realPath}`;
  }
}
```

### Why It Exists

Without the prefix:

- Vite might try to read from disk
- Other plugins might process it
- File watchers might look for it

The `\0` prefix tells the system "don't treat this as a filesystem path."

### Rollup Standard

This convention comes from Rollup and is documented in the [Rollup plugin documentation](https://rollupjs.org/plugin-development/#conventions). Vite inherits it.

## Module Generation

### Processing Trigger

When the `load` hook is called:

```typescript
async load(id) {
  if (id.startsWith('\0zone5:')) {
    const realPath = id.slice('\0zone5:'.length);
    const feature = await processImage(realPath);
    return generateModule(feature);
  }
}
```

### JSON to ES Module

The `@rollup/pluginutils` package converts data to ES modules:

```typescript
import { dataToEsm } from '@rollup/pluginutils';

function generateModule(feature: ItemFeature) {
  return dataToEsm(feature, {
    preferConst: true,
    namedExports: false
  });
}
```

Output:

```javascript
export default {
  type: 'Feature',
  id: 'abc123',
  properties: { /* ... */ },
  assets: [ /* ... */ ]
};
```

## Development Middleware

### Serving Processed Images

During development, processed images need to be served. The plugin adds middleware:

```typescript
configureServer(server) {
  server.middlewares.use((req, res, next) => {
    if (req.url?.startsWith('/@zone5/')) {
      // Serve from cache directory
      const file = resolveCachePath(req.url);
      res.sendFile(file);
    } else {
      next();
    }
  });
}
```

### URL Mapping

Asset URLs in ItemFeature map to cache files:

```
/@zone5/photos-sunset-a1b2c3/640.jpg
  → .zone5/photos-sunset-a1b2c3/640.jpg
```

### Hot Reload

When a source image changes:

1. Vite detects file change
2. Plugin reprocesses the image
3. Module is invalidated
4. Browser reloads with new data

## Build Output

### Where Files End Up

During build:

```typescript
generateBundle() {
  // Copy cache directory to build output
  copySync('.zone5', 'dist/@zone5');
}
```

The namespace (`@zone5` by default) becomes a directory in the build output.

### Asset Handling

Assets are referenced by URL in the ItemFeature:

```typescript
assets: [
  { href: '/@zone5/photo/640.jpg', width: 640 }
]
```

These URLs work in both dev (middleware) and production (static files).

## Plugin Order

### Why Before SvelteKit

Zone5 plugin must come before SvelteKit:

```typescript
// vite.config.ts
plugins: [
  zone5(),      // First
  sveltekit()   // Second
]
```

### What Goes Wrong Otherwise

If SvelteKit processes first:

- It sees `?z5` query and might strip it
- Import resolution happens before Zone5 can intercept
- Error: module not found

### Vite Plugin Array Order

Vite runs plugins in array order for most hooks. The `enforce` option can override this, but Zone5 relies on natural order.

## Debugging

### Inspect Resolved Modules

Use Vite's debug mode:

```bash
DEBUG=vite:resolve pnpm dev
```

This shows how imports are resolved.

### Common Issues

**"Failed to resolve import"**

```
Failed to resolve import "./photo.jpg?z5"
```

Causes:

- Plugin not installed
- Plugin order wrong
- File path incorrect

**"Cannot find module"**

```
Cannot find module '\0zone5:...'
```

Causes:

- Load hook not returning content
- Processing error

### Vite Debug Mode

```bash
# See all resolution
DEBUG=vite:* pnpm dev

# See just Zone5 plugin
DEBUG=vite:zone5 pnpm dev
```

## Related

- [Architecture Overview](../architecture-overview/) - How plugins fit together
- [Vite Plugin API](../../reference/vite-plugin-api/) - Plugin API reference
- [Configuration Reference](../../reference/configuration/) - Plugin options
