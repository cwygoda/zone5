import dayjs, { type Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import utc from 'dayjs/plugin/utc.js';

import type { GeojsonPoint } from './types.js';

dayjs.extend(customParseFormat);
dayjs.extend(utc);

export const makeDate = (value: Date, offset?: string): Dayjs | undefined => {
	if (value instanceof Date && !isNaN(value.valueOf())) {
		const date = dayjs(value);
		if (offset) {
			const [offset_hours_string, offset_minutes_string] = offset.split(':');
			const offset_minutes = parseInt(offset_hours_string) * 60 + parseInt(offset_minutes_string);
			return date.utcOffset(offset_minutes, true);
		}
		return date;
	}
};

export const makeRational = (value: unknown, round?: number): [number, number] | undefined => {
	if (typeof value === 'number') {
		if (value < 1) {
			return [1, 1 / value];
		}
		return [round === undefined ? value : +value.toFixed(round), 1];
	}
};

export const gpsToGeoJson = (exifData: { [key: string]: unknown }): GeojsonPoint | null => {
	const latitude = exifData.latitude,
		longitude = exifData.longitude,
		altitude = exifData.GPSAltitude;
	if (typeof longitude === 'number' && typeof latitude === 'number') {
		let coordinates: [number, number] | [number, number, number] = [longitude, latitude];
		if (typeof altitude === 'number') {
			coordinates = [...coordinates, altitude];
		}
		return {
			type: 'Point',
			coordinates,
		};
	}
	return null;
};
