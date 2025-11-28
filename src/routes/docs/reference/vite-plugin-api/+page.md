# Vite Plugin API Reference

`zone5()` Vite plugin function options and behavior.

---

## Import

```typescript
import { zone5 } from 'zone5/vite';
```

## Function Signature

```typescript
function zone5(cwd?: string): Plugin
```

### Parameters

| Parameter | Type     | Default     | Description                                                                          |
| --------- | -------- | ----------- | ------------------------------------------------------------------------------------ |
| `cwd`     | `string` | `undefined` | Working directory for loading `.zone5.toml`. If not specified, uses `process.cwd()`. |

### Return Value

Returns a Vite `Plugin` object.

## Basic Usage

```typescript
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { zone5 } from 'zone5/vite';

export default defineConfig({
  plugins: [
    zone5(),
    sveltekit()
  ]
});
```

## Plugin Order

The `zone5()` plugin **must** come before `sveltekit()` in the plugins array.

```typescript
plugins: [
  zone5(),      // First
  sveltekit()   // After zone5
]
```

This is required because Zone5 needs to intercept module resolution before SvelteKit processes imports.

## Behavior

### Module Resolution

The plugin intercepts imports with the `?z5` query parameter:

```typescript
import photo from './image.jpg?z5';
```

When detected:

1. Resolves the import to a virtual module (prefixed with `\0`)
2. Processes the image if not cached
3. Returns an ES module with the `ItemFeature` data

### Virtual Module Generation

For each `?z5` import, the plugin generates an ES module:

```typescript
// Generated module content
export const type = "Feature";
export const id = "abc123";
export const geometry = null;
export const properties = { /* ... */ };
export const assets = [ /* ... */ ];
export default { type, id, geometry, properties, assets };
```

### Development Middleware

In development and preview modes, the plugin adds middleware to serve processed images:

- URL pattern: `/@zone5/<image-hash>/<width>.jpg`
- Serves from the `.zone5/` cache directory
- Sets `Cache-Control: max-age=360000`

### Build Output

During production builds:

1. Processes all imported images
2. Copies `.zone5/` cache to the output directory
3. Images are served from `/<namespace>/` URL path

## Configuration Loading

The plugin loads configuration from `.zone5.toml`:

1. Starts from `cwd` parameter (or `process.cwd()`)
2. Walks up directory tree until config found
3. Uses defaults if no config file exists

## Supported File Types

Currently supports:

- `.jpg` / `.jpeg` files with `?z5` query parameter

## Related

- [Configuration Reference](../configuration/) - `.zone5.toml` options
- [Vite Module Resolution](../../explanation/vite-module-resolution/) - How module resolution works
- [Add to Existing Project](../../tutorials/add-to-existing-project/) - Setup tutorial
