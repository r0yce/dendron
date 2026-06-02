/**
 * Browser/extension-host TextDecoder (DOM global), not Node's util.TextDecoder.
 * Centralizes the web-interop boundary for strict + bundler setups.
 */
export function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder("utf-8").decode(bytes);
}