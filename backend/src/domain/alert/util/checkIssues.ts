/**
 * Backward compatibility wrapper for checkIssues
 * This file maintains the original import path and re-exports the refactored implementation
 */

// Re-export everything from the modular implementation
export * from './checkIssues/index';

// Also provide the named export for compatibility
export { checkIssues } from './checkIssues/index';