// Zone5 image import type declarations
// Using inline import() type to avoid making this a module

declare module '*?z5' {
	const data: import('$lib/processor').ItemFeature;
	export default data;
}
