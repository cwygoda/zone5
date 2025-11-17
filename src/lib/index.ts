// Main exports
export { load } from './config.js';
export type { BaseConfigType, ConfigType } from './config.js';

// Re-export processor
export { default, default as processor } from './processor/index.js';
export type * from './processor/index.js';

// Re-export types
export type * from './components/types.js';
export type * from './module.js';
