/**
 * Adapters for infrastructure concerns.
 *
 * These modules handle integration with external systems
 * (URL state, storage, etc.) separate from core domain logic.
 */

export { createUrlSync, type UrlSyncDependencies } from './url-sync.js';
