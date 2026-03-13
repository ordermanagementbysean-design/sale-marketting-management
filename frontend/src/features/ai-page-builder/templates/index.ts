import type { TemplateConfig } from "../types";

function isTemplateConfig(x: unknown): x is TemplateConfig {
  return (
    typeof x === "object" &&
    x !== null &&
    "id" in x &&
    "name" in x &&
    "structure" in x &&
    "sections" in x &&
    Array.isArray((x as TemplateConfig).sections)
  );
}

/** Tự động load mọi file *.ts trong thư mục (trừ index.ts). Thêm template mới = thêm 1 file, không cần sửa file này. */
const modules = import.meta.glob("./*.ts", { eager: true });

const TEMPLATES: Record<string, TemplateConfig> = {};
for (const path of Object.keys(modules)) {
  if (path === "./index.ts") continue;
  const mod = modules[path] as Record<string, unknown>;
  const template = Object.values(mod).find(isTemplateConfig);
  if (template) TEMPLATES[template.id] = template;
}

export const TEMPLATE_LIST: TemplateConfig[] = Object.values(TEMPLATES);
export { TEMPLATES };
