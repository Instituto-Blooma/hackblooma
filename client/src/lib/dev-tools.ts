export function isDevToolsEnabled() {
  return import.meta.env.DEV || import.meta.env.VITE_E2E === 'true';
}
