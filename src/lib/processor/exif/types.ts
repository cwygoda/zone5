export interface GeojsonPoint {
	type: 'Point';
	coordinates: [number, number] | [number, number, number];
}
