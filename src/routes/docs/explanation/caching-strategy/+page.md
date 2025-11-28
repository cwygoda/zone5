# Caching Strategy

Hash-based cache invalidation explained.

---

## Why Caching Matters

Image processing is computationally expensive:

| Operation                 | Time per Image |
| ------------------------- | -------------- |
| Sharp resize (5 variants) | 500-2000ms     |
| EXIF extraction           | 50-100ms       |
| Blurhash generation       | 100-300ms      |
| Color extraction          | 50-100ms       |

A gallery of 100 images would take 1-4 minutes to process. Without caching, every build would repeat this work.

## Cache Key Design

Zone5 uses a three-part cache key:

```
{config-hash}-{relative-path}-{content-hash}
```

Example:

```
sunset.jpg → 1b74f43f-sunset-a1b2c3d4/
```

### Why Config Hash

- Config changes force reprocessing

### Why Relative Path

The path component ensures:

- Human-readable cache directories
- Easy debugging (find processed version of a file)
- No collisions between `a/photo.jpg` and `b/photo.jpg` ???

### Why Content Hash

The hash ensures:

- Changed files are reprocessed
- Unchanged files use cache
- Git operations don't cause false invalidation

## Content Hashing

### What Gets Hashed

Only the file contents are hashed:

```typescript
const hash = createHash('sha256')
  .update(await fs.readFile(sourceFile))
  .digest('hex')
  .slice(0, 8);
```

### What Doesn't Affect Cache

These don't change the hash:

- File modification timestamp
- File permissions
- Directory name changes (only relative path matters)

### Why Not Timestamp-Based

Timestamps are unreliable:

- `git clone` sets all timestamps to clone time
- CI environments may have inconsistent times
- Touching a file without changing it would trigger reprocess

Content hashing catches actual changes only.

## Cache Directory Structure

```
.zone5/
├── 1b74f43f-photos-sunset-a1b2c3d4/
│   ├── index.json          # Metadata (ItemFeature)
│   ├── 640.jpg             # Variant
│   ├── 768.jpg
│   ├── 1280.jpg
│   ├── 1920.jpg
│   └── 2560.jpg
├── 1b74f43f-photos-mountain-e5f6g7h8/
│   ├── index.json
│   └── ...
```

Each source image gets a directory named `{path}-{hash}`.

### index.json

Contains the complete ItemFeature:

```json
{
  "type": "Feature",
  "id": "a1b2c3d4",
  "properties": {
    "width": 4000,
    "height": 3000,
    "blurhash": "LEHV6nWB2yk8...",
    "averageColor": { "hex": "#4a7c59" }
  },
  "assets": [...]
}
```

## Invalidation Triggers

### Automatic Reprocessing

Cache is bypassed when:

1. **Source file changes** - Different content hash
2. **Cache missing** - First build or cleared cache
3. **`forceOverwrite` option** - Explicit reprocess request

### Manual Cache Clear

```bash
rm -rf .zone5
```

Next build reprocesses everything.

## Cache Portability

### Moving Between Machines

The cache is portable if:

- Same relative paths to source images
- Same Zone5 version (output format)

### CI/CD Caching

Cache the `.zone5` directory between CI runs:

```yaml
# GitHub Actions
- uses: actions/cache@v3
  with:
    path: .zone5
    key: zone5-${{ hashFiles('src/images/**') }}
```

This significantly speeds up builds when images haven't changed.

## Trade-offs

### Disk Space

More variants = more disk space:

| Images | Variants | Approx. Size |
| ------ | -------- | ------------ |
| 100    | 5        | 500MB - 1GB  |
| 500    | 5        | 2.5GB - 5GB  |
| 1000   | 5        | 5GB - 10GB   |

### Initial Build Time

First build processes all images:

| Images | Approx. Time  |
| ------ | ------------- |
| 100    | 2-4 minutes   |
| 500    | 10-20 minutes |
| 1000   | 20-40 minutes |

Subsequent builds are fast (seconds) if images unchanged.

## Git and Caching

### Whether to Commit Cache

**Commit cache if**:

- Small gallery (less than 100 images)
- Team needs instant builds
- Acceptable repo size increase

**Don't commit if**:

- Large gallery
- CI caching available
- Repo size is a concern

### .gitignore Recommendations

```gitignore
# Don't commit cache (default)
.zone5/
```

Or:

```gitignore
# Commit cache but not variants (just metadata)
.zone5/**/[0-9]*.jpg
```

### Large Repository Considerations

For large galleries:

- Use Git LFS for source images
- Use CI caching instead of committing `.zone5`
- Consider storing cache in cloud storage

## Related

- [Configuration Reference](../../reference/configuration/) - Cache options
- [Configure Caching](../../how-to/configure-caching/) - How to customize
- [Image Processing Pipeline](../image-processing-pipeline/) - What gets cached
