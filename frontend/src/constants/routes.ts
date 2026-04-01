/** Base path for the admin panel (all authenticated routes live under this prefix). */
export const PANEL_BASE = "/x-0401-panel";

/** Build a path under the panel, e.g. `panelPath("login")` → `/x-0401-panel/login`. */
export function panelPath(subPath = ""): string {
  if (!subPath || subPath === "/") return PANEL_BASE;
  const normalized = subPath.startsWith("/") ? subPath : `/${subPath}`;
  return `${PANEL_BASE}${normalized}`;
}
