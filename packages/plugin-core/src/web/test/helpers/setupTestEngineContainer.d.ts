/**
 * Prepare a test container for running a real engine against a temporary
 * vault/note set. For most tests, this won't actually be necessary because we
 * can just run against in-memory notes
 */
export declare function setupTestEngineContainer(): Promise<void>;
