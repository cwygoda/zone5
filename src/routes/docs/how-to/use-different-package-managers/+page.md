# Use Different Package Managers

Configure Zone5 CLI and projects with npm, pnpm, yarn, or bun.

---

## Problem

You want to use your preferred package manager instead of npm when creating Zone5 projects.

## CLI Usage

Use the `--package-manager` flag with `zone5 create`:

```bash
# pnpm
npx zone5 create ./photos ./gallery --package-manager pnpm

# yarn
npx zone5 create ./photos ./gallery --package-manager yarn

# bun
npx zone5 create ./photos ./gallery --package-manager bun

# Skip installation (manual)
npx zone5 create ./photos ./gallery --package-manager skip
```

## Related

- [CLI Commands Reference](../reference/cli-commands/) - Full CLI documentation
