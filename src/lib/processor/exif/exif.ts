import exifr from 'exifr';

import { gpsToGeoJson, makeDate, makeRational } from './converters.js';
import { DEFAULT_LENS_MAP, DEFAULT_MAP_MAKE, DEFAULT_MAP_MODEL } from './defaults.js';
import type { GeojsonPoint } from './types.js';

type Rational = [number, number];

export interface ExifItem {
	type: 'Feature';
	geometry: GeojsonPoint | null;
	properties: {
		make?: string;
		model?: string;
		dateTime?: string;
		artist?: string;
		copyright?: string;
		exposureTime?: Rational;
		fNumber?: Rational;
		iso?: number;
		focalLength?: Rational;
		lens?: string;
	};
}

interface Options {
	make_map?: { [key: string]: string };
	model_map?: { [key: string]: string };
	lens_map?: { [key: string]: string };
	warn_on_unknown_make?: boolean;
	warn_on_unknown_model?: boolean;
	warn_on_unknown_lens?: boolean;
}

const findInMap = (
	value: string | undefined,
	map: { [key: string]: string },
	warn: boolean | undefined = true,
): string | undefined => {
	if (value === undefined) return undefined;

	const result = map[value];
	if (!result) {
		if (warn) {
			console.warn(`Zone5: item not in map: ${value}`);
		}
		return value;
	}
	return result;
};

export async function exifFromFilePath(filePath: string, options: Options = {}): Promise<ExifItem> {
	const {
		make_map = DEFAULT_MAP_MAKE,
		model_map = DEFAULT_MAP_MODEL,
		lens_map = DEFAULT_LENS_MAP,
		warn_on_unknown_make = true,
		warn_on_unknown_model = true,
		warn_on_unknown_lens = true,
	} = options;
	const exifData = await exifr.parse(filePath, {});

	if (!exifData || Object.keys(exifData).length === 0) {
		return {
			type: 'Feature',
			geometry: null,
			properties: {},
		};
	}

	const mappedData: ExifItem = {
		type: 'Feature',
		geometry: gpsToGeoJson(exifData) || null,
		properties: {
			make: findInMap(exifData.Make || exifData['271'], make_map || {}, warn_on_unknown_make),
			model: findInMap(exifData.Model || exifData['272'], model_map || {}, warn_on_unknown_model),
			dateTime: makeDate(exifData.DateTimeOriginal, exifData.OffsetTimeOriginal)?.format(),
			artist: exifData.Artist,
			copyright: exifData.Copyright,
			exposureTime: makeRational(exifData.ExposureTime),
			fNumber: makeRational(exifData.FNumber, 1),
			iso: exifData.ISO,
			focalLength: makeRational(exifData.FocalLength, 1),
			lens: findInMap(exifData.LensModel, lens_map || {}, warn_on_unknown_lens),
		},
	};

	return mappedData;
}
