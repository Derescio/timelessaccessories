/**
 * React wrapper that includes useEffectEvent polyfill
 * This is needed for Sanity 5.x compatibility with React 19
 * Only used for Sanity packages via webpack alias
 */
import * as react from 'react';
import { useEffectEvent } from 'use-effect-event';

// Export everything from React plus useEffectEvent
export * from 'react';
export { useEffectEvent };

