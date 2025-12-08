import type { ItemFeature } from '../processor';

export interface ImageData extends ItemFeature {
	properties: ItemFeature['properties'] & {
		alt: string;
		title?: string;
	};
}

export type MapUrlBuilder = (lat: number, lon: number) => string;
