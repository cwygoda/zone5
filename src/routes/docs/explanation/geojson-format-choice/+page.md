# GeoJSON Format Choice

Why ItemFeature uses GeoJSON structure.

---

## What is GeoJSON

GeoJSON is a standard format for encoding geographic data:

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [-122.4194, 37.7749]
  },
  "properties": {
    "name": "San Francisco"
  }
}
```

It's defined by [RFC 7946](https://tools.ietf.org/html/rfc7946) and widely supported by mapping tools.

## Why Use It for Images

### Natural Fit for GPS

Photos often contain GPS coordinates in EXIF data. GeoJSON's geometry field is designed exactly for this:

```typescript
{
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [-122.4194, 37.7749]  // [longitude, latitude]
  },
  properties: { /* image metadata */ }
}
```

No need for custom GPS handling or separate fields.

### Properties Bag

The `properties` object is a flexible container for any metadata:

```typescript
properties: {
  width: 4000,
  height: 3000,
  aspectRatio: 1.333,
  blurhash: 'LEHV6nWB2yk8...',
  averageColor: { hex: '#4a7c59' },
  exif: {
    make: 'Canon',
    model: 'EOS R5',
    lens: 'RF 24-70mm F2.8L'
  }
}
```

This is standard GeoJSON—no extensions required.

## The ItemFeature Structure

Zone5's output format:

```typescript
interface ItemFeature {
  type: 'Feature';                    // Required by GeoJSON spec
  id: string;                         // Unique identifier
  geometry: Point | null;             // GPS coordinates or null
  properties: {
    width: number;
    height: number;
    aspectRatio: number;
    blurhash: string;
    averageColor: { hex: string; rgb: number[] };
    exif?: ExifItem;
  };
  assets: Asset[];                    // Image variants (Zone5 extension)
}
```

### The `assets` Extension

Standard GeoJSON doesn't include an `assets` field. Zone5 adds it to store variant URLs:

```typescript
assets: [
  { href: '/@zone5/photo/640.jpg', width: 640 },
  { href: '/@zone5/photo/1280.jpg', width: 1280 },
  { href: '/@zone5/photo/1920.jpg', width: 1920 }
]
```

This is inspired by STAC (SpatioTemporal Asset Catalog), another geospatial standard.

## Benefits

### Existing Tooling

Many libraries work with GeoJSON out of the box:

```typescript
// Leaflet
L.geoJSON(itemFeature).addTo(map);

// Mapbox GL
map.addSource('photo', { type: 'geojson', data: itemFeature });

// Turf.js
const distance = turf.distance(point1, itemFeature);
```

### Self-Documenting

Developers familiar with GeoJSON immediately understand the structure. The `type: 'Feature'` field signals "this is standard GeoJSON."

### TypeScript Support

Type definitions exist for GeoJSON:

```typescript
import type { Feature, Point } from 'geojson';

// ItemFeature extends the standard Feature type
interface ItemFeature extends Feature<Point | null> {
  properties: ImageProperties;
  assets: Asset[];
}
```

### Future Features

The format enables future mapping features:

- Photo maps with markers
- Clustering by location

## When Geometry is Null

Not all photos have GPS data:

```typescript
{
  type: 'Feature',
  geometry: null,  // Valid GeoJSON
  properties: { /* still has all metadata */ }
}
```

This is valid GeoJSON per RFC 7946. Components check for null before using coordinates:

## Related

- [ItemFeature Schema](../../reference/itemfeature-schema/) - Full schema reference
- [Architecture Overview](../architecture-overview/) - System design
