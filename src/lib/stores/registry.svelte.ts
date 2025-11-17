import { SvelteMap } from 'svelte/reactivity';
import { type Readable, get, writable } from 'svelte/store';

import type { ImageData } from '../components/types';

export type Registry = Readable<{
	images: ImageData[];
	current: ImageData | null;
	currentOffset: number | null;
	offsets: Map<symbol, { start: number; count: number }>;
}> & {
	register: (componentId: symbol, images: ImageData[]) => void;
	remove: (componentId: symbol) => void;
	clear: () => void;
	setCurrent: (componentId: symbol, offset: number) => void;
	findCurrent: (id: string) => boolean;
	next: () => void;
	prev: () => void;
	clearCurrent: () => void;
};

const store = writable<{
	images: ImageData[];
	current: ImageData | null;
	currentOffset: number | null;
	offsets: Map<symbol, { start: number; count: number }>;
}>({
	images: [],
	current: null,
	currentOffset: null,
	offsets: new Map(),
});

const mod = (n: number, m: number) => ((n % m) + m) % m;

const registry: Registry = {
	subscribe: store.subscribe,
	register: (componentId: symbol, images: ImageData[]) => {
		store.update((previous) => {
			const offset = previous.offsets.get(componentId);
			const start = offset?.start ?? previous.images.length;
			const deleteCount = offset?.count ?? 0;

			previous.offsets.set(componentId, { start, count: images.length });
			return {
				...previous,
				images: previous.images.toSpliced(start, deleteCount, ...images),
				current: null,
			};
		});
	},
	remove: (componentId: symbol) => {
		store.update((previous) => {
			const offset = previous.offsets.get(componentId);
			if (!offset) {
				return previous;
			}
			return {
				...previous,
				images: previous.images.toSpliced(offset.start, offset.count),
				current: null,
			};
		});
	},
	clear: () => {
		store.set({ images: [], current: null, currentOffset: null, offsets: new SvelteMap() });
	},
	setCurrent: (componentId: symbol, offset: number) => {
		const registered = get(store).offsets.get(componentId);
		if (!registered) {
			throw new Error(`no component registered under given key.`);
		}
		if (offset < 0 || offset >= registered.count) {
			throw new Error(`offset not within registered image count for component`);
		}

		const newCurrentIndex = registered.start + offset;
		store.update((current) => ({
			...current,
			current: current.images[newCurrentIndex],
			currentOffset: newCurrentIndex,
		}));
	},
	findCurrent: (id: string) => {
		const value = get(store);
		const index = value.images.findIndex((img) => img.id === id);
		if (index >= 0 && value.currentOffset !== index) {
			store.update((current) => ({
				...current,
				current: current.images[index],
				currentOffset: index,
			}));
		}
		return index >= 0;
	},
	next: () => {
		const current = get(store);
		if (current.currentOffset === null) {
			throw new Error('can not call next with not current image');
		}

		const newCurrentIndex = mod(current.currentOffset + 1, current.images.length);
		store.update((current) => ({
			...current,
			current: current.images[newCurrentIndex],
			currentOffset: newCurrentIndex,
		}));
	},
	prev: () => {
		const current = get(store);
		if (current.currentOffset === null) {
			throw new Error('can not call prev with not current image');
		}

		const newCurrentIndex = mod(current.currentOffset - 1, current.images.length);
		store.update((current) => ({
			...current,
			current: current.images[newCurrentIndex],
			currentOffset: newCurrentIndex,
		}));
	},
	clearCurrent: () => {
		store.update((current) => ({
			...current,
			current: null,
			currentOffset: null,
		}));
	},
};

export default registry;
