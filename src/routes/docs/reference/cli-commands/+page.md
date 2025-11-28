# CLI Commands Reference

Complete `zone5` CLI command reference.

---

## zone5 create

Create a new SvelteKit project with Zone5 image processing pre-configured.

### Synopsis

```bash
zone5 create <input-folder> <output-folder> [options]
```

### Arguments

| Argument          | Description                                            |
| ----------------- | ------------------------------------------------------ |
| `<input-folder>`  | Path to directory containing source images (JPG files) |
| `<output-folder>` | Path where the new project will be created             |

### Options

| Option                       | Default | Description                                              |
| ---------------------------- | ------- | -------------------------------------------------------- |
| `-m, --mode <type>`          | `copy`  | How to handle images: `copy`, `link`, or `move`          |
| `-p, --package-manager <pm>` | `npm`   | Package manager: `npm`, `pnpm`, `yarn`, `bun`, or `skip` |
| `--no-interactive`           | -       | Skip prompts and use defaults                            |
| `--help`                     | -       | Show help message                                        |
| `--version`                  | -       | Show version number                                      |

### Image Modes

- **`copy`** - Copies images to the project's `static/images/` directory. Safe option that preserves originals.
- **`link`** - Creates symbolic links to original images. Saves disk space but requires originals to remain in place.
- **`move`** - Moves images to the project. Use when you want to consolidate files.

### Package Managers

- **`npm`** - Node Package Manager (default)
- **`pnpm`** - Fast, disk space efficient package manager
- **`yarn`** - Yarn package manager
- **`bun`** - Fast all-in-one JavaScript runtime
- **`skip`** - Don't install dependencies; run installation manually later

### Exit Codes

| Code | Description                                         |
| ---- | --------------------------------------------------- |
| `0`  | Success                                             |
| `1`  | Error (invalid arguments, missing directory, etc.)  |

### Output

The command creates a complete SvelteKit project with:

```text
output-folder/
├── .zone5.toml             # Zone5 configuration
├── package.json            # Project dependencies
├── vite.config.ts          # Vite config with zone5 plugin
├── svelte.config.js        # SvelteKit config with mdsvex
└── src/
    ├── routes/
    │   ├── +layout.svelte  # Zone5Provider wrapper
    │   ├── +page.md        # Gallery page with your images
    │   └── photo.jpg       # You images (copied/linked/moved)
    └── app.css             # Tailwind config
```

---

## Global Options

Available for all commands:

| Option      | Description               |
| ----------- | ------------------------- |
| `--help`    | Show help for the command |
| `--version` | Show Zone5 version        |

### Check Version

```bash
npx zone5 --version
```

### Get Help

```bash
npx zone5 --help
npx zone5 create --help
```

---

## Related

- [Getting Started](../../tutorials/getting-started/) - Tutorial using the CLI
- [Configuration Reference](../configuration/) - `.zone5.toml` options
- [Use Different Package Managers](../../how-to/use-different-package-managers/) - Package manager details
