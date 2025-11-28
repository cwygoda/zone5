# ItemFeature Schema Reference

GeoJSON output format with all metadata fields.

---

## Overview

`ItemFeature` is the data structure returned when importing images with `?z5`. It follows the GeoJSON Feature specification.

## TypeScript Type

```typescript
interface ItemFeature {
  type: 'Feature';
  id: string;
  geometry: GeojsonPoint | null;
  properties: {
    // EXIF metadata
    make?: string;
    model?: string;
    dateTime?: string;
    artist?: string;
    copyright?: string;
    exposureTime?: [number, number];
    fNumber?: [number, number];
    iso?: number;
    focalLength?: [number, number];
    lens?: string;

    // Visual properties
    aspectRatio: number;
    blurhash: string;
    averageColor: DominantColor;
  };
  assets: Array<{
    href: string;
    width: number;
  }>;
}

interface GeojsonPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

interface DominantColor {
  hex: string;
  rgb: [number, number, number];
}
```

## Structure

### Root Properties

| Property     | Type                   | Description                                 |
| ------------ | ---------------------- | ------------------------------------------- |
| `type`       | `'Feature'`            | GeoJSON type identifier                     |
| `id`         | `string`               | Unique hash based on file path and contents |
| `geometry`   | `GeojsonPoint \| null` | GPS coordinates if available                |
| `properties` | `object`               | All metadata and visual properties          |
| `assets`     | `array`                | Generated image variants                    |

### geometry

GPS location extracted from EXIF data.

```typescript
{
  type: 'Point',
  coordinates: [-122.4194, 37.7749] // [longitude, latitude]
}
```

Returns `null` if the image has no GPS EXIF data.

### properties

#### EXIF Metadata

| Property       | Type                | Description                                           |
| -------------- | ------------------- | ----------------------------------------------------- |
| `make`         | `string?`           | Camera manufacturer (e.g., "Canon")                   |
| `model`        | `string?`           | Camera model (e.g., "EOS R5")                         |
| `lens`         | `string?`           | Lens model                                            |
| `dateTime`     | `string?`           | Capture date/time in ISO format                       |
| `artist`       | `string?`           | Photographer name from EXIF                           |
| `copyright`    | `string?`           | Copyright notice from EXIF                            |
| `exposureTime` | `[number, number]?` | Shutter speed as rational (e.g., `[1, 125]` = 1/125s) |
| `fNumber`      | `[number, number]?` | Aperture as rational (e.g., `[8, 1]` = f/8)           |
| `iso`          | `number?`           | ISO sensitivity                                       |
| `focalLength`  | `[number, number]?` | Focal length as rational (e.g., `[50, 1]` = 50mm)     |

#### Visual Properties

| Property       | Type            | Description                                  |
| -------------- | --------------- | -------------------------------------------- |
| `aspectRatio`  | `number`        | Width divided by height                      |
| `blurhash`     | `string`        | Compact placeholder string for loading state |
| `averageColor` | `DominantColor` | Extracted dominant color                     |

### assets

Array of generated image variants:

```typescript
[
  { href: '/@zone5/photo-abc123/640.jpg', width: 640 },
  { href: '/@zone5/photo-abc123/1280.jpg', width: 1280 },
  { href: '/@zone5/photo-abc123/1920.jpg', width: 1920 }
]
```

| Property | Type     | Description             |
| -------- | -------- | ----------------------- |
| `href`   | `string` | URL path to the variant |
| `width`  | `number` | Width in pixels         |

## Complete Example

```json
{
  "type": "Feature",
  "id": "a1b2c3d4e5f6",
  "geometry": {
    "type": "Point",
    "coordinates": [-122.4194, 37.7749]
  },
  "properties": {
    "make": "Canon",
    "model": "EOS R5",
    "lens": "RF 24-70mm F2.8 L IS USM",
    "dateTime": "2024-06-15T14:30:00-07:00",
    "artist": "Jane Photographer",
    "copyright": "© 2024 Jane Photographer",
    "exposureTime": [1, 250],
    "fNumber": [56, 10],
    "iso": 400,
    "focalLength": [50, 1],
    "aspectRatio": 1.5,
    "blurhash": "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
    "averageColor": {
      "hex": "#4a7c59",
      "rgb": [74, 124, 89]
    }
  },
  "assets": [
    { "href": "/@zone5/photo-a1b2c3d4e5f6/640.jpg", "width": 640 },
    { "href": "/@zone5/photo-a1b2c3d4e5f6/768.jpg", "width": 768 },
    { "href": "/@zone5/photo-a1b2c3d4e5f6/1280.jpg", "width": 1280 },
    { "href": "/@zone5/photo-a1b2c3d4e5f6/1920.jpg", "width": 1920 },
    { "href": "/@zone5/photo-a1b2c3d4e5f6/2560.jpg", "width": 2560 }
  ]
}
```

## Usage

### Import and Access

```typescript
import photo from './photo.jpg?z5';

// Access properties
console.log(photo.properties.model);     // "EOS R5"
console.log(photo.properties.aspectRatio); // 1.5
console.log(photo.geometry?.coordinates); // [-122.4194, 37.7749]
```

### With Components

Zone5 components expect `ImageData`, which extends `ItemFeature` with `alt` and `title`:

```typescript
import type { ImageData } from 'zone5/components';

const image: ImageData = {
  ...photo,
  properties: {
    ...photo.properties,
    alt: 'Mountain landscape',
    title: 'Sunset at Mount Tam'
  }
};
```

## Rational Number Format

EXIF exposure values are stored as rational numbers `[numerator, denominator]`:

```typescript
// Convert to readable format
const aperture = photo.properties.fNumber;
if (aperture) {
  const fStop = aperture[0] / aperture[1]; // e.g., 5.6
  console.log(`f/${fStop}`);
}

const shutter = photo.properties.exposureTime;
if (shutter) {
  if (shutter[0] >= shutter[1]) {
    console.log(`${shutter[0] / shutter[1]}s`); // e.g., "2s"
  } else {
    console.log(`${shutter[0]}/${shutter[1]}s`); // e.g., "1/250s"
  }
}
```

## Cache File Location

ItemFeature data is cached as JSON:

```
.zone5/
└── 1b74f43f-photo-a1b2c3d4e5f6/
    ├── index.json      # ItemFeature JSON
    ├── 640.jpg
    ├── 768.jpg
    ├── 1280.jpg
    ├── 1920.jpg
    └── 2560.jpg
```

## Related

- [GeoJSON Format Choice](../../explanation/geojson-format-choice/) - Why GeoJSON
- [Component Props Reference](../component-props/) - Component API
