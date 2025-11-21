# Package Exports Reference

All entry points exported by the zone5 package.

---

## Main Entry (zone5)

```typescript
import { load, toToml, type ConfigType, type ItemFeature } from 'zone5';
```

### Exports

| Export        | Type       | Description                           |
| ------------- | ---------- | ------------------------------------- |
| `load`        | `function` | Load configuration from `.zone5.toml` |
| `toToml`      | `function` | Convert config object to TOML string  |
| `ConfigType`  | `type`     | Configuration type definition         |
| `ItemFeature` | `type`     | Image feature data type               |

---

## Components (zone5/components)

```typescript
import { Zone5, Zone5Provider, Zone5Img, Zone5Lightbox } from 'zone5/components';
```

### Exports

| Export           | Type        | Description                   |
| ---------------- | ----------- | ----------------------------- |
| `Zone5`          | `component` | Main gallery component        |
| `Zone5Provider`  | `component` | Context provider for lightbox |
| `Zone5Img`       | `component` | Individual image component    |
| `Zone5Lightbox`  | `component` | Full-screen lightbox modal    |

### Type Exports

```typescript
import type { ImageData } from 'zone5/components';
```

| Export      | Description                    |
| ----------- | ------------------------------ |
| `ImageData` | Image data type with alt/title |

---

## Atom Components (zone5/components/atoms)

```typescript
import { Button, CloseButton, NextButton, PrevButton } from 'zone5/components/atoms';
```

### Exports

| Export        | Type        | Description               |
| ------------- | ----------- | ------------------------- |
| `Button`      | `component` | Base button component     |
| `CloseButton` | `component` | Close button with X icon  |
| `NextButton`  | `component` | Next navigation arrow     |
| `PrevButton`  | `component` | Previous navigation arrow |

---

## Vite Plugin (zone5/vite)

```typescript
import { zone5 } from 'zone5/vite';
```

### Exports

| Export  | Type       | Description         |
| ------- | ---------- | ------------------- |
| `zone5` | `function` | Vite plugin factory |

### Usage

```typescript
// vite.config.ts
import { zone5 } from 'zone5/vite';

export default defineConfig({
  plugins: [zone5()]
});
```

---

## Remark Plugin (zone5/remark)

```typescript
import { remarkZ5Images } from 'zone5/remark';
```

### Exports

| Export           | Type     | Description                       |
| ---------------- | -------- | --------------------------------- |
| `remarkZ5Images` | `Plugin` | Remark plugin for markdown images |

### Usage

```javascript
// svelte.config.js
import { remarkZ5Images } from 'zone5/remark';

mdsvex({
  remarkPlugins: [remarkZ5Images]
})
```

---

## Package.json Exports Field

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "svelte": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./components": {
      "types": "./dist/components/index.d.ts",
      "svelte": "./dist/components/index.js",
      "default": "./dist/components/index.js"
    },
    "./components/atoms": {
      "types": "./dist/components/atoms/index.d.ts",
      "svelte": "./dist/components/atoms/index.js",
      "default": "./dist/components/atoms/index.js"
    },
    "./vite": {
      "types": "./dist/vite.d.ts",
      "default": "./dist/vite.js"
    },
    "./remark": {
      "types": "./dist/remark.d.ts",
      "default": "./dist/remark.js"
    }
  }
}
```

---

## Import Examples

### Svelte Component

```svelte
<script>
  import { Zone5, Zone5Provider } from 'zone5/components';
  import { CloseButton } from 'zone5/components/atoms';
</script>
```

### Vite Configuration

```typescript
import { zone5 } from 'zone5/vite';
```

### SvelteKit Configuration

```javascript
import { remarkZ5Images } from 'zone5/remark';
```

### TypeScript Types

```typescript
import type { ItemFeature, ConfigType } from 'zone5';
import type { ImageData } from 'zone5/components';
```

---

## Related

- [Component Props Reference](./component-props/) - Component API
- [Vite Plugin API](./vite-plugin-api/) - Plugin documentation
- [Remark Plugin API](./remark-plugin-api/) - Markdown plugin docs
