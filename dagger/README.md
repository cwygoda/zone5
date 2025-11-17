# Zone5 Dagger Pipelines

This directory contains Dagger.io pipelines for fully isolated, reproducible testing of Zone5.

## Overview

Dagger provides containerized CI/CD pipelines that run consistently across local development and CI environments. Each pipeline runs in complete isolation with its own container, ensuring reproducible results.

## Available Pipelines

### Test Pipelines

- **Unit Tests**: Fast vitest tests (excluding CLI tests)

  ```bash
  pnpm dagger:test
  ```

- **CLI Integration Tests**: CLI-specific tests (requires CLI build)

  ```bash
  pnpm dagger:test:cli
  ```

- **E2E Tests**: Playwright end-to-end tests

  ```bash
  pnpm dagger:test:e2e
  ```

- **All Tests**: Run all test suites in parallel

  ```bash
  pnpm dagger:test:all
  ```

### Quality Checks

- **Linting**: Run ESLint

  ```bash
  pnpm dagger:lint
  ```

- **Type Checking**: Run svelte-check

  ```bash
  pnpm dagger:check
  ```

### Build

- **Build Package**: Build and export the package

  ```bash
  pnpm dagger:build
  ```

### Full CI Pipeline

Run the complete CI pipeline (lint, check, test all, build):

```bash
pnpm dagger:ci
```

## Direct Dagger CLI Usage

You can also use the Dagger CLI directly for more control:

```bash
# List available functions
dagger -m ./dagger functions

# Run a specific function with custom parameters
dagger -m ./dagger call test --source=. --help

# View the container configuration
dagger -m ./dagger call test --source=. terminal
```

## Architecture

### Container Setup

Each pipeline uses:

- **Base Image**: Node.js 22 Alpine (or Playwright image for E2E)
- **Package Manager**: pnpm 10.18.2
- **Caching**: Persistent cache volumes for `pnpm-store` and `playwright-browsers`

### Isolation Benefits

1. **Reproducibility**: Same container environment everywhere
2. **Parallelization**: Run multiple pipelines concurrently without conflicts
3. **Caching**: Intelligent caching of dependencies and build artifacts
4. **No Pollution**: Each run starts from a clean slate

### Performance Optimizations

- Dependency caching via named volumes
- Parallel execution of independent tests
- Minimal base images (Alpine Linux)
- Excluded directories to reduce context transfer

## Development

### Module Structure

```
dagger/
├── dagger.json          # Dagger module configuration
├── package.json         # Module dependencies
├── tsconfig.json        # TypeScript configuration
└── src/
    └── index.ts         # Pipeline definitions
```

### Adding New Pipelines

To add a new pipeline function:

1. Add the function to `src/index.ts` with the `@func()` decorator
2. Use the `Container` and `Directory` types from `@dagger.io/dagger`
3. Update package.json scripts to expose the new function
4. Test locally before committing

### Local Development Tips

- Use `dagger develop` to work on the module interactively
- Use `dagger call <function> terminal` to debug containers
- Check logs with `dagger -v` for verbose output
- Cache is stored in `~/.config/dagger` by default

## Troubleshooting

### Pipeline Failures

If a pipeline fails:

1. Check the output for specific error messages
2. Run the same test locally without Dagger to isolate the issue
3. Use `dagger call <function> --source=. terminal` to debug interactively

### Cache Issues

To clear caches:

```bash
# Clear Dagger engine cache
dagger cache prune

# Or clear all Docker caches
docker system prune -a
```

### Performance Issues

If pipelines are slow:

1. Ensure Docker has sufficient resources allocated
2. Check network connectivity (dependency downloads)
3. Use `dagger -v` to identify slow steps
4. Consider adjusting cache volume strategies

## Resources

- [Dagger Documentation](https://docs.dagger.io)
- [Dagger TypeScript SDK](https://docs.dagger.io/sdk/typescript)
- [Zone5 Project Documentation](../CLAUDE.md)
