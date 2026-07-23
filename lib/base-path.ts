/**
 * Deployment basePath.
 *
 * This app is deployed behind nginx at:
 *   https://<host>/focusimporter
 */
export const BASE_PATH = "/focusimporter";

/** Prefix a path (e.g. "/api/auth/login") with the deployment basePath. */
export function withBasePath(path: string): string {
  if (!path) return BASE_PATH;
  if (path.startsWith(BASE_PATH)) return path;
  if (path.startsWith("/")) return `${BASE_PATH}${path}`;
  return `${BASE_PATH}/${path}`;
}