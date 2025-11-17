/**
 * Test setup file for Vitest
 * Configures the environment for component testing
 */

// Mock ResizeObserver for jsdom
class ResizeObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}

// Set up DOM environment
if (typeof global !== 'undefined') {
	global.window = global.window || {};
	global.ResizeObserver = ResizeObserverMock;
}

// Ensure we're in a browser-like environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
	// Add ResizeObserver polyfill for jsdom
	if (!window.ResizeObserver) {
		window.ResizeObserver = ResizeObserverMock;
	}
	// Browser environment is ready
	console.log('Test environment: Browser (jsdom)');
}
