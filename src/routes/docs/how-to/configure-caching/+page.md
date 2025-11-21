# Configure Caching

Control the `.zone5/` cache directory behavior and location.

---

## Problem

You need to manage the processed image cache for your project—change its location, clear it, or optimize it for CI/CD.

## Change Cache Location

Edit `.zone5.toml`:

```toml
[base]
cache = ".zone5"  # Default
```

### Use Cases

#### Shared Cache in Monorepo

```toml
[base]
cache = "../../.zone5-cache"
```

Multiple projects share one cache, reducing duplication.

#### Temporary Cache

```toml
[base]
cache = "/tmp/zone5-cache"
```

Cache doesn't persist between restarts. Useful for CI or when disk space is limited.

#### Project-Specific Cache

```toml
[base]
cache = ".zone5/gallery-main"
```

Separate caches for different configurations.

## Clear the Cache

Delete the cache directory to force reprocessing:

```bash
rm -rf .zone5
```

### When to Clear

- After changing processor settings (variants, kernel)
- When images appear corrupted
- To free disk space
- Before a clean build

### Safe Clearing

The cache is safe to delete—it will regenerate on next build. To preserve during development:

```bash
# Move instead of delete
mv .zone5 .zone5-backup

# After testing, restore or delete
rm -rf .zone5-backup
```

## Commit Cache to Git

You can commit the cache for faster CI builds.

### Pros

- No processing during CI builds
- Consistent output across builds
- Faster deployment

### Cons

- Increases repository size
- Must remember to update cache when images change

### Configuration

```bash
# Remove from .gitignore (or don't add it)
# .zone5/  # Commented out

# Add and commit
git add .zone5/
git commit -m "Add Zone5 cache"
```

### Recommended: Git LFS

For large caches, use Git LFS:

```bash
# Track cache with LFS
git lfs track ".zone5/**"
git add .gitattributes
git add .zone5/
git commit -m "Add Zone5 cache with LFS"
```

## CI/CD Caching

Cache between builds for faster CI runs.

### GitHub Actions

```yaml
name: Build
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Cache Zone5
        uses: actions/cache@v4
        with:
          path: .zone5
          key: zone5-${{ hashFiles('static/images/**') }}
          restore-keys: |
            zone5-

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
```

The cache key uses image file hashes, so it updates when images change.

## Understand Cache Invalidation

### How Keys Work

Cache directories are named with a hash:

```
.zone5/
└── 1b74f43f-photo-a1b2c3d4/  # Hash of path + content
    ├── index.json
    └── variants...
```

The hash includes:

- Processor config hash
- Relative file path
- File content (SHA hash)

### When Images Reprocess

Images are reprocessed when:

- Processor config changes
- Source file content changes
- Cache directory is deleted
- Different source file path

Images are NOT reprocessed when:

- File timestamp changes (git clone, copy)
- Configuration changes (must clear cache)
- Metadata-only changes

## Troubleshoot Cache Issues

### Stale Images

**Symptom**: Old image versions display after updating source

**Fix**: Clear cache and rebuild

```bash
rm -rf .zone5
npm run dev
```

### Missing Variants

**Symptom**: Some sizes not loading

**Fix**: Check configuration and rebuild

```bash
# Verify config
cat .zone5.toml

# Clear and rebuild
rm -rf .zone5
npm run build
```

### Corrupted Cache

**Symptom**: Build errors or garbled images

**Fix**: Full cache clear

```bash
rm -rf .zone5
npm run build
```

### Large Cache Size

**Symptom**: Cache consuming too much disk

**Fix**: Reduce variants or clear old entries

```toml
# .zone5.toml - fewer variants
[processor]
variants = [640, 1280, 1920]
```

## Related

- [Caching Strategy](../explanation/caching-strategy/) - How caching works
- [Configuration Reference](../reference/configuration/) - All config options
