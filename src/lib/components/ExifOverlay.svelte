<script lang="ts" module>
	declare const __ZONE5_MAP_URL_CONFIG__: string | null | undefined;
</script>

<script lang="ts">
	import { fade } from 'svelte/transition';
	import { ExternalLink, X } from '@lucide/svelte';

	import type { ImageData, MapUrlBuilder } from './types';
	import Button from './atoms/Button.svelte';

	interface Props {
		image: ImageData;
		mapUrl?: MapUrlBuilder;
		onclose: () => void;
		transitionDuration?: number;
	}

	const HARDCODED_DEFAULT = 'https://earth.google.com/web/@{lat},{lon},0a,1000d,35y,0h,0t,0r';

	const defaultMapUrl: MapUrlBuilder = (lat, lon) => {
		const configValue =
			typeof __ZONE5_MAP_URL_CONFIG__ !== 'undefined' ? __ZONE5_MAP_URL_CONFIG__ : null;
		const template = configValue ?? HARDCODED_DEFAULT;
		return template.replace('{lat}', String(lat)).replace('{lon}', String(lon));
	};

	const { image, mapUrl = defaultMapUrl, onclose, transitionDuration = 200 }: Props = $props();

	const formatExposure = (rational: [number, number] | undefined): string | null => {
		if (!rational) return null;
		const [num, denom] = rational;
		if (denom === 1) return `${num}s`;
		return `${num}/${denom}s`;
	};

	const formatFNumber = (rational: [number, number] | undefined): string | null => {
		if (!rational) return null;
		const [num, denom] = rational;
		const value = num / denom;
		return `ƒ/${value % 1 === 0 ? value : value.toFixed(1)}`;
	};

	const formatFocalLength = (rational: [number, number] | undefined): number | null => {
		if (!rational) return null;
		const [num, denom] = rational;
		return Math.round(num / denom);
	};

	const formatDateTime = (dateTime: string | undefined): string | null => {
		if (!dateTime) return null;
		try {
			const date = new Date(dateTime);
			return date.toLocaleDateString(undefined, {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			});
		} catch {
			return dateTime;
		}
	};

	const formatDMS = (decimal: number): string => {
		const abs = Math.abs(decimal);
		const degrees = Math.floor(abs);
		const minutesDecimal = (abs - degrees) * 60;
		const minutes = Math.floor(minutesDecimal);
		const seconds = (minutesDecimal - minutes) * 60;
		return `${degrees}°${minutes}′${seconds.toFixed(1)}″`;
	};

	const formatCoordinates = (
		geometry: { type: 'Point'; coordinates: number[] } | null,
		urlBuilder: MapUrlBuilder,
	): { display: string; url: string } | null => {
		if (!geometry || geometry.type !== 'Point') return null;
		const [lon, lat] = geometry.coordinates;
		const latDir = lat >= 0 ? 'N' : 'S';
		const lonDir = lon >= 0 ? 'E' : 'W';
		return {
			display: `${formatDMS(lat)}${latDir}, ${formatDMS(lon)}${lonDir}`,
			url: urlBuilder(lat, lon),
		};
	};

	const imageProps = $derived(image.properties);
	const camera = $derived(
		[imageProps.make, imageProps.model].filter(Boolean).join(' ') || null,
	);
	const exposure = $derived(formatExposure(imageProps.exposureTime));
	const fNumber = $derived(formatFNumber(imageProps.fNumber));
	const focalLengthValue = $derived(formatFocalLength(imageProps.focalLength));
	const focalLength35mm = $derived(imageProps.focalLength35mm);
	const dateTime = $derived(formatDateTime(imageProps.dateTime));
	const coordinates = $derived(formatCoordinates(image.geometry, mapUrl));

	// Build sentence-like settings string
	const settingsSentence = $derived.by(() => {
		const parts: string[] = [];

		// Focal length: prefer 35mm equivalent, show sensor-size as title
		if (focalLength35mm) {
			parts.push(`${focalLength35mm}mm`);
		} else if (focalLengthValue) {
			parts.push(`${focalLengthValue}mm`);
		}

		if (fNumber) {
			parts.push(`at ${fNumber}`);
		}

		if (exposure) {
			parts.push(exposure);
		}

		if (imageProps.iso) {
			parts.push(`ISO ${imageProps.iso}`);
		}

		return parts.length > 0 ? parts.join(', ') : null;
	});

	// Sensor-size focal length for hover title
	const focalLengthTitle = $derived(
		focalLength35mm && focalLengthValue && focalLength35mm !== focalLengthValue
			? `Sensor: ${focalLengthValue}mm`
			: undefined,
	);
</script>

<div
	class="fixed inset-0 z-[60] flex items-center justify-center"
	transition:fade={{ duration: transitionDuration }}
	role="dialog"
	aria-modal="true"
	aria-label="Image information"
>
	<div
		class="relative m-4 sm:m-8 md:m-16 max-w-md w-full bg-white/20 backdrop-blur-xl text-white rounded-lg shadow-2xl overflow-hidden border border-white/30"
	>
		<Button
			class="absolute right-2 top-2 p-2 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white"
			onaction={onclose}
			aria-label="close info"
		>
			<X size={20} />
		</Button>

		<div class="p-6 pt-12">
			<h2 class="sr-only">Image Information</h2>

			<dl class="space-y-3 text-sm">
				{#if camera}
					<div class="flex gap-4">
						<dt class="text-white/70 drop-shadow text-right w-20 shrink-0">Camera</dt>
						<dd class="font-medium drop-shadow">{camera}</dd>
					</div>
				{/if}

				{#if imageProps.lens}
					<div class="flex gap-4">
						<dt class="text-white/70 drop-shadow text-right w-20 shrink-0">Lens</dt>
						<dd class="font-medium drop-shadow">{imageProps.lens}</dd>
					</div>
				{/if}

				{#if settingsSentence}
					<div class="flex gap-4">
						<dt class="text-white/70 drop-shadow text-right w-20 shrink-0">Settings</dt>
						<dd class="font-medium drop-shadow" title={focalLengthTitle}>{settingsSentence}</dd>
					</div>
				{/if}

				{#if dateTime}
					<div class="flex gap-4 border-t border-white/20 pt-3">
						<dt class="text-white/70 drop-shadow text-right w-20 shrink-0">Date</dt>
						<dd class="font-medium drop-shadow">{dateTime}</dd>
					</div>
				{/if}

				{#if imageProps.artist}
					<div class="flex gap-4 border-t border-white/20 pt-3">
						<dt class="text-white/70 drop-shadow text-right w-20 shrink-0">Artist</dt>
						<dd class="font-medium drop-shadow">{imageProps.artist}</dd>
					</div>
				{/if}

				{#if imageProps.copyright}
					<div class="flex gap-4">
						<dt class="text-white/70 drop-shadow text-right w-20 shrink-0">Copyright</dt>
						<dd class="font-medium drop-shadow">{imageProps.copyright}</dd>
					</div>
				{/if}

				{#if coordinates}
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<div class="flex gap-4">
						<dt class="text-white/70 drop-shadow text-right w-20 shrink-0">Location</dt>
						<dd class="font-medium font-mono text-xs drop-shadow">
							<a
								href={coordinates.url}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex items-center gap-1 hover:text-white/80"
							>
								{coordinates.display}
								<ExternalLink size={12} />
							</a>
						</dd>
					</div>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{/if}
			</dl>
		</div>
	</div>
</div>
