export type TemplateStatus = "active" | "archived";

export interface TemplateRecord {
  id: string;
  title: string;
  description: string;
  html: string;
  status: TemplateStatus;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_TEMPLATE_TITLE = "Новий шаблон документа";
export const DEFAULT_TEMPLATE_HTML =
  "<p><strong>Шаблон документа</strong></p><p>Почніть текст шаблону і вставляйте змінні справа.</p>";
export const TEMPLATES_STORAGE_KEY = "law-organizer.template-builder.templates";

export const normalizeTemplateRecord = (
  template: Partial<TemplateRecord> & Pick<TemplateRecord, "id">,
): TemplateRecord => {
  const now = new Date().toISOString();

  return {
    id: template.id,
    title: template.title || DEFAULT_TEMPLATE_TITLE,
    description: template.description || "",
    html: template.html || DEFAULT_TEMPLATE_HTML,
    status: template.status === "archived" ? "archived" : "active",
    createdAt: template.createdAt || now,
    updatedAt: template.updatedAt || template.createdAt || now,
  };
};

export const createTemplateId = () =>
  `template-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const loadStoredTemplates = (): TemplateRecord[] => {
  const raw = window.localStorage.getItem(TEMPLATES_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Array<Partial<TemplateRecord>>;
    return Array.isArray(parsed)
      ? parsed
          .filter(
            (
              item,
            ): item is Partial<TemplateRecord> & Pick<TemplateRecord, "id"> =>
              typeof item?.id === "string" && item.id.length > 0,
          )
          .map((item) => normalizeTemplateRecord(item))
      : [];
  } catch {
    window.localStorage.removeItem(TEMPLATES_STORAGE_KEY);
    return [];
  }
};

export const persistTemplates = (templates: TemplateRecord[]) => {
  window.localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
};
