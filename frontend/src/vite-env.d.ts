/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '/pyodide/pyodide.mjs' {
  export function loadPyodide(options: { indexURL: string }): Promise<unknown>;
}
