import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  PanelRightClose,
  PanelRightOpen,
  ChevronRight,
  FileText,
  Plus,
  Save,
  Search,
} from "lucide-react";
import { Editor } from "@tinymce/tinymce-react";
import tinymce, { type Editor as TinyMCEEditor } from "tinymce";
import "tinymce/models/dom/model.min.js";
import "tinymce/themes/silver/theme.min.js";
import "tinymce/icons/default/icons.min.js";
import "tinymce/skins/ui/oxide/skin.js";
import "tinymce/skins/ui/oxide/content.js";
import "tinymce/skins/content/default/content.js";
import "tinymce/plugins/advlist";
import "tinymce/plugins/autolink";
import "tinymce/plugins/autoresize";
import "tinymce/plugins/charmap";
import "tinymce/plugins/code";
import "tinymce/plugins/fullscreen";
import "tinymce/plugins/insertdatetime";
import "tinymce/plugins/link";
import "tinymce/plugins/lists";
import "tinymce/plugins/nonbreaking";
import "tinymce/plugins/pagebreak";
import "tinymce/plugins/preview";
import "tinymce/plugins/quickbars";
import "tinymce/plugins/searchreplace";
import "tinymce/plugins/table";
import "tinymce/plugins/visualblocks";
import "tinymce/plugins/visualchars";
import "tinymce/plugins/wordcount";
import { useNavigate } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { PageHeader } from "../../components/PageHeader";
import { RecordActionsMenu } from "../../components/RecordActionsMenu";
import { Breadcrumbs } from "../../components/navigation";
import { documentService } from "../../services/document.service";
import {
  buildEditorContentStyle,
  buildPrintableHtml,
  buildTemplateTokenHtml,
  buildVariableGroups,
  DEFAULT_TEMPLATE_DOCUMENT_SETTINGS,
  getTemplateTokenText,
  getVariableLookup,
  sanitizeTemplateHtml,
  summarizeTemplateVariables,
  TemplateVariableDefinition,
  TemplateVariableGroup,
  toGenitiveCase,
} from "./templateBuilder.utils";
import {
  createTemplateId,
  DEFAULT_TEMPLATE_HTML,
  DEFAULT_TEMPLATE_TITLE,
  loadStoredTemplates,
  persistTemplates,
  TemplateRecord,
  TemplateStatus,
} from "./templateRegistry";
import { registerTinyMceUk } from "./tinymceUk";
import "./PrintFormsPage.css";

const tinyMceGlobal = globalThis as typeof globalThis & {
  tinymce?: typeof tinymce;
};

tinyMceGlobal.tinymce = tinymce;
registerTinyMceUk();

type TemplateMode = "list" | "editor";
type TemplateEditorView = "edit" | "preview";
type VariablesRailMode = "static" | "fixed" | "bottom";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === "object" &&
    error &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return fallback;
};

export const PrintFormsPage: React.FC = () => {
  const navigate = useNavigate();
  const tinyMceRef = useRef<TinyMCEEditor | null>(null);
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const variablesRailContainerRef = useRef<HTMLElement | null>(null);
  const variablesRailFrameRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<TemplateMode>("list");
  const [templates, setTemplates] = useState<TemplateRecord[]>(() =>
    loadStoredTemplates(),
  );
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateStatusFilter, setTemplateStatusFilter] = useState<
    TemplateStatus | "all"
  >("all");
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(
    null,
  );
  const [templateTitle, setTemplateTitle] = useState(DEFAULT_TEMPLATE_TITLE);
  const [templateDescription, setTemplateDescription] = useState("");
  const [editorHtml, setEditorHtml] = useState(DEFAULT_TEMPLATE_HTML);
  const [editorView, setEditorView] = useState<TemplateEditorView>("edit");
  const [search, setSearch] = useState("");
  const [expandedVariableGroups, setExpandedVariableGroups] = useState<
    string[]
  >([]);
  const [insertGenitive, setInsertGenitive] = useState(false);
  const [isVariablesRailCollapsed, setIsVariablesRailCollapsed] =
    useState(false);
  const [variablesRailMode, setVariablesRailMode] =
    useState<VariablesRailMode>("static");
  const [variablesRailTop, setVariablesRailTop] = useState(72);
  const [variablesRailWidth, setVariablesRailWidth] = useState(0);
  const [variablesRailHeight, setVariablesRailHeight] = useState(0);
  const [variablesRailMaxHeight, setVariablesRailMaxHeight] = useState(0);
  const [savingToFiles, setSavingToFiles] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const variableGroups = useMemo(() => buildVariableGroups(new Date()), []);
  const variableLookup = useMemo(
    () => getVariableLookup(variableGroups),
    [variableGroups],
  );
  const editorContentStyle = useMemo(
    () => buildEditorContentStyle(DEFAULT_TEMPLATE_DOCUMENT_SETTINGS),
    [],
  );

  const filteredGroups: TemplateVariableGroup[] = useMemo(
    () =>
      variableGroups
        .map((group) => ({
          ...group,
          variables: group.variables.filter((variable) => {
            if (!search.trim()) {
              return true;
            }

            const query = search.trim().toLowerCase();
            return (
              variable.label.toLowerCase().includes(query) ||
              variable.description.toLowerCase().includes(query) ||
              variable.id.toLowerCase().includes(query)
            );
          }),
        }))
        .filter((group) => group.variables.length > 0),
    [search, variableGroups],
  );

  const resetEditor = () => {
    setCurrentTemplateId(null);
    setTemplateTitle(DEFAULT_TEMPLATE_TITLE);
    setTemplateDescription("");
    setEditorHtml(DEFAULT_TEMPLATE_HTML);
    setSearch("");
    setExpandedVariableGroups([]);
    setInsertGenitive(false);
    setEditorView("edit");
    setActionError(null);
    setActionMessage(null);
  };

  const openCreateTemplate = () => {
    resetEditor();
    setMode("editor");
  };

  const openTemplate = (
    template: TemplateRecord,
    view: TemplateEditorView = "preview",
  ) => {
    setCurrentTemplateId(template.id);
    setTemplateTitle(template.title);
    setTemplateDescription(template.description);
    setEditorHtml(template.html);
    setSearch("");
    setExpandedVariableGroups([]);
    setInsertGenitive(false);
    setEditorView(view);
    setActionError(null);
    setActionMessage(null);
    setMode("editor");
  };

  const saveTemplatesState = (nextTemplates: TemplateRecord[]) => {
    setTemplates(nextTemplates);
    persistTemplates(nextTemplates);
  };

  const getCurrentEditorHtml = () =>
    sanitizeTemplateHtml(
      tinyMceRef.current?.getContent() || editorHtml,
      variableLookup,
    );

  const handleSaveTemplate = () => {
    const now = new Date().toISOString();
    const sanitizedHtml = getCurrentEditorHtml();
    const nextRecord: TemplateRecord = {
      id: currentTemplateId || createTemplateId(),
      title: templateTitle.trim() || DEFAULT_TEMPLATE_TITLE,
      description: templateDescription.trim(),
      html: sanitizedHtml,
      status:
        templates.find((item) => item.id === currentTemplateId)?.status ||
        "active",
      createdAt:
        templates.find((item) => item.id === currentTemplateId)?.createdAt ||
        now,
      updatedAt: now,
    };

    const nextTemplates = currentTemplateId
      ? templates.map((item) =>
          item.id === currentTemplateId ? nextRecord : item,
        )
      : [nextRecord, ...templates];

    setEditorHtml(sanitizedHtml);
    saveTemplatesState(nextTemplates);
    setCurrentTemplateId(nextRecord.id);
    setEditorView("preview");
    setActionMessage("Шаблон збережено у реєстрі шаблонів.");
  };

  const handleDuplicateTemplate = (template: TemplateRecord) => {
    const duplicate: TemplateRecord = {
      ...template,
      id: createTemplateId(),
      title: `${template.title} (копія)`,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveTemplatesState([duplicate, ...templates]);
    setActionMessage(`Шаблон "${template.title}" продубльовано.`);
  };

  const handleArchiveTemplate = (template: TemplateRecord) => {
    const nextStatus: TemplateStatus =
      template.status === "archived" ? "active" : "archived";
    saveTemplatesState(
      templates.map((item) =>
        item.id === template.id ? { ...item, status: nextStatus } : item,
      ),
    );
    setActionMessage(
      nextStatus === "archived"
        ? `Шаблон "${template.title}" архівовано.`
        : `Шаблон "${template.title}" відновлено.`,
    );
  };

  const handleDeleteTemplate = (template: TemplateRecord) => {
    if (
      !window.confirm(
        `Видалити шаблон "${template.title}"? Цю дію не можна швидко скасувати.`,
      )
    ) {
      return;
    }

    saveTemplatesState(templates.filter((item) => item.id !== template.id));
    if (currentTemplateId === template.id) {
      resetEditor();
      setMode("list");
    }
    setActionMessage(`Шаблон "${template.title}" видалено.`);
  };

  const handleInsertVariable = (variable: TemplateVariableDefinition) => {
    const editor = tinyMceRef.current;
    if (!editor) {
      return;
    }

    const useGenitive =
      variable.defaultCaseMode === "genitive" ||
      (insertGenitive && variable.inflection !== "none");
    editor.focus();
    editor.insertContent(buildTemplateTokenHtml(variable, useGenitive));
    setEditorHtml(sanitizeTemplateHtml(editor.getContent(), variableLookup));
    setExpandedVariableGroups([]);
    setSearch("");
  };

  const handleDownload = (modeType: "html" | "doc") => {
    setActionError(null);
    const sanitizedHtml = getCurrentEditorHtml();
    const printableHtml = buildPrintableHtml(templateTitle, sanitizedHtml);
    const extension = modeType === "doc" ? "doc" : "html";
    const mimeType =
      modeType === "doc" ? "application/msword" : "text/html;charset=utf-8";
    const blob = new Blob([printableHtml], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${templateTitle || "template"}.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setActionMessage(
      modeType === "doc"
        ? "HTML-шаблон завантажено у DOC-сумісному форматі."
        : "HTML-шаблон завантажено.",
    );
  };

  const handlePrint = () => {
    const printWindow = window.open(
      "",
      "_blank",
      "noopener,noreferrer,width=1200,height=900",
    );

    if (!printWindow) {
      setActionError("Браузер заблокував вікно друку.");
      return;
    }

    const sanitizedHtml = getCurrentEditorHtml();
    printWindow.document.open();
    printWindow.document.write(
      buildPrintableHtml(templateTitle, sanitizedHtml),
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleSaveToFiles = async () => {
    setSavingToFiles(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const sanitizedHtml = getCurrentEditorHtml();
      const printableHtml = buildPrintableHtml(templateTitle, sanitizedHtml);
      const file = new File(
        [printableHtml],
        `${templateTitle || "template"}.html`,
        { type: "text/html" },
      );

      await documentService.uploadDocument(file, {
        type: "other",
        accessLevel: "internal",
        description:
          templateDescription ||
          "HTML-шаблон документа з плейсхолдерами для генерації",
      });

      setActionMessage("HTML-шаблон збережено у модуль Файли.");
    } catch (error) {
      setActionError(
        getErrorMessage(error, "Не вдалося зберегти шаблон у Файли."),
      );
    } finally {
      setSavingToFiles(false);
    }
  };

  const handleCreateDocumentFromTemplate = (templateId?: string) => {
    const nextTemplateId = templateId || currentTemplateId;
    if (!nextTemplateId) {
      setActionError(
        "Спочатку збережіть шаблон, щоб створити документ на його основі.",
      );
      return;
    }

    navigate(`/documents/create?mode=template&templateId=${nextTemplateId}`);
  };

  const filteredTemplates = templates
    .filter((template) =>
      templateStatusFilter === "all"
        ? true
        : template.status === templateStatusFilter,
    )
    .filter((template) => {
      if (!templateSearch.trim()) {
        return true;
      }

      const query = templateSearch.trim().toLowerCase();
      return (
        template.title.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query)
      );
    })
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

  const searchHasValue = search.trim().length > 0;

  const toggleVariableGroup = (groupId: string) => {
    setExpandedVariableGroups((current) =>
      current.includes(groupId) ? [] : [groupId],
    );
  };

  useEffect(() => {
    let frameId = 0;

    const updateVariablesRail = () => {
      const layoutNode = layoutRef.current;
      const containerNode = variablesRailContainerRef.current;
      const frameNode = variablesRailFrameRef.current;

      if (
        !layoutNode ||
        !containerNode ||
        !frameNode ||
        editorView === "preview" ||
        window.innerWidth <= 1180
      ) {
        setVariablesRailMode("static");
        setVariablesRailWidth(0);
        setVariablesRailHeight(0);
        setVariablesRailMaxHeight(0);
        return;
      }

      const topNavigation =
        document.querySelector<HTMLElement>(".top-navigation");
      const topOffset =
        (topNavigation?.getBoundingClientRect().height || 54) + 12;
      const layoutTop = layoutNode.getBoundingClientRect().top + window.scrollY;
      const layoutBottom = layoutTop + layoutNode.offsetHeight;
      const frameHeight = frameNode.offsetHeight;
      const containerWidth = containerNode.offsetWidth;
      const maxHeight = Math.max(window.innerHeight - topOffset - 16, 240);
      const viewportTop = window.scrollY + topOffset;

      let nextMode: VariablesRailMode = "static";

      if (viewportTop > layoutTop) {
        nextMode =
          viewportTop + frameHeight >= layoutBottom ? "bottom" : "fixed";
      }

      setVariablesRailMode(nextMode);
      setVariablesRailTop(topOffset);
      setVariablesRailWidth(containerWidth);
      setVariablesRailHeight(frameHeight);
      setVariablesRailMaxHeight(maxHeight);
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateVariablesRail);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    let resizeObserver: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        scheduleUpdate();
      });

      if (layoutRef.current) {
        resizeObserver.observe(layoutRef.current);
      }
      if (variablesRailContainerRef.current) {
        resizeObserver.observe(variablesRailContainerRef.current);
      }
      if (variablesRailFrameRef.current) {
        resizeObserver.observe(variablesRailFrameRef.current);
      }
    }

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      resizeObserver?.disconnect();
    };
  }, [editorView, isVariablesRailCollapsed]);

  const variablesRailContainerStyle =
    variablesRailMode === "fixed" || variablesRailMode === "bottom"
      ? { minHeight: `${variablesRailHeight}px` }
      : undefined;

  const variablesRailFrameStyle =
    variablesRailMode === "fixed"
      ? ({
          top: `${variablesRailTop}px`,
          width: `${variablesRailWidth}px`,
          maxHeight: `${variablesRailMaxHeight}px`,
          ["--template-rail-top-offset" as string]: `${variablesRailTop}px`,
        } as React.CSSProperties)
      : undefined;

  if (mode === "list") {
    return (
      <div className="template-builder-page">
        <Breadcrumbs />
        <PageHeader
          title="Конструктор шаблонів"
          actions={
            <button
              type="button"
              className="btn btn-primary"
              onClick={openCreateTemplate}
            >
              <Plus size={16} />
              Додати шаблон
            </button>
          }
        />

        {actionError && <Alert type="error">{actionError}</Alert>}
        {actionMessage && <Alert type="success">{actionMessage}</Alert>}

        <section className="template-builder-shell content-surface">
          <div className="filters-bar template-list-filters">
            <div className="search-box">
              <Search size={18} />
              <input
                type="search"
                value={templateSearch}
                onChange={(event) => setTemplateSearch(event.target.value)}
                placeholder="Пошук шаблонів..."
              />
            </div>
            <select
              value={templateStatusFilter}
              onChange={(event) =>
                setTemplateStatusFilter(
                  event.target.value as TemplateStatus | "all",
                )
              }
            >
              <option value="all">Усі шаблони</option>
              <option value="active">Активні</option>
              <option value="archived">Архівні</option>
            </select>
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="empty-state template-empty-state">
              <FileText size={56} />
              <h3>Шаблони не знайдено</h3>
              <button
                type="button"
                className="btn btn-primary"
                onClick={openCreateTemplate}
              >
                Додати шаблон
              </button>
            </div>
          ) : (
            <div className="template-registry">
              <div className="template-registry-head">
                <span>Шаблон</span>
                <span>Змінні</span>
                <span>Оновлено</span>
                <span>Статус</span>
                <span className="template-registry-actions">Дії</span>
              </div>

              {filteredTemplates.map((template) => (
                <article key={template.id} className="template-registry-row">
                  <div className="template-registry-main">
                    <button
                      type="button"
                      className="template-row-link"
                      onClick={() => openTemplate(template, "preview")}
                    >
                      {template.title}
                    </button>
                    <p>{template.description || "Опис відсутній"}</p>
                  </div>
                  <div className="template-context-cell">
                    {summarizeTemplateVariables(template.html, variableLookup)}
                  </div>
                  <span>
                    {new Date(template.updatedAt).toLocaleDateString("uk-UA")}
                  </span>
                  <span
                    className={`badge ${
                      template.status === "archived"
                        ? "badge-default"
                        : "badge-success"
                    }`}
                  >
                    {template.status === "archived" ? "Архів" : "Активний"}
                  </span>
                  <div className="template-registry-menu">
                    <RecordActionsMenu
                      actions={[
                        {
                          label: "Відкрити",
                          onClick: () => openTemplate(template, "preview"),
                        },
                        {
                          label: "Редагувати",
                          onClick: () => openTemplate(template, "edit"),
                        },
                        {
                          label: "Створити документ",
                          onClick: () =>
                            handleCreateDocumentFromTemplate(template.id),
                        },
                        {
                          label: "Дублювати",
                          onClick: () => handleDuplicateTemplate(template),
                        },
                        {
                          label:
                            template.status === "archived"
                              ? "Відновити"
                              : "Архівувати",
                          onClick: () => handleArchiveTemplate(template),
                        },
                        {
                          label: "Видалити",
                          onClick: () => handleDeleteTemplate(template),
                          danger: true,
                        },
                      ]}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="template-builder-page">
      <Breadcrumbs />
      <PageHeader
        title={currentTemplateId ? "Редагування шаблону" : "Новий шаблон"}
        actions={
          <div className="template-builder-header-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setMode("list")}
            >
              <ArrowLeft size={16} />
              До списку
            </button>
            {editorView === "preview" ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setEditorView("edit")}
              >
                <FileText size={16} />
                Редагувати
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveTemplate}
              >
                <Save size={16} />
                Зберегти шаблон
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveToFiles}
              disabled={savingToFiles}
            >
              <Save size={16} />
              {savingToFiles ? "Збереження..." : "У Файли"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleCreateDocumentFromTemplate()}
            >
              <FileText size={16} />
              Створити документ
            </button>
          </div>
        }
      />

      {actionError && <Alert type="error">{actionError}</Alert>}
      {actionMessage && <Alert type="success">{actionMessage}</Alert>}

      <section className="template-builder-shell content-surface">
        <div className="template-builder-topbar">
          <label className="template-builder-field">
            <span>Назва шаблону</span>
            <input
              type="text"
              value={templateTitle}
              onChange={(event) => setTemplateTitle(event.target.value)}
              placeholder="Наприклад: Договір про правничу допомогу"
            />
          </label>
          <label className="template-builder-field template-builder-field-wide">
            <span>Опис</span>
            <input
              type="text"
              value={templateDescription}
              onChange={(event) => setTemplateDescription(event.target.value)}
              placeholder="Короткий опис шаблону"
            />
          </label>
        </div>

        <div
          ref={layoutRef}
          className={`template-builder-layout ${
            isVariablesRailCollapsed
              ? "template-builder-layout--rail-collapsed"
              : ""
          } ${editorView === "preview" ? "template-builder-layout--preview" : ""}`}
        >
          <div className="template-builder-main">
            {editorView === "preview" ? (
              <div className="template-preview-host">
                <iframe
                  title="Попередній перегляд шаблону"
                  className="template-preview-frame"
                  srcDoc={buildPrintableHtml(
                    templateTitle,
                    getCurrentEditorHtml(),
                  )}
                />
              </div>
            ) : (
              <div className="template-editor-host">
                <Editor
                  licenseKey="gpl"
                  value={editorHtml}
                  onInit={(_, editor) => {
                    tinyMceRef.current = editor;
                  }}
                  onEditorChange={(value) => setEditorHtml(value)}
                  init={{
                    min_height: 760,
                    autoresize_bottom_margin: 48,
                    menubar: false,
                    plugins: [
                      "advlist",
                      "autolink",
                      "autoresize",
                      "charmap",
                      "code",
                      "fullscreen",
                      "insertdatetime",
                      "link",
                      "lists",
                      "nonbreaking",
                      "pagebreak",
                      "preview",
                      "quickbars",
                      "searchreplace",
                      "table",
                      "visualblocks",
                      "visualchars",
                      "wordcount",
                    ],
                    toolbar:
                      "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | table link charmap insertdatetime pagebreak | searchreplace visualblocks visualchars preview fullscreen | removeformat code",
                    toolbar_mode: "wrap",
                    toolbar_sticky: true,
                    toolbar_sticky_offset: 72,
                    language: "uk",
                    block_formats:
                      "Абзац=p; Заголовок 1=h1; Заголовок 2=h2; Заголовок 3=h3; Заголовок 4=h4",
                    font_family_formats:
                      "Times New Roman=times new roman,times,serif; Golos Text=Golos Text,sans-serif; Arial=arial,helvetica,sans-serif",
                    fontsize_formats:
                      "10pt 11pt 12pt 13pt 14pt 15pt 16pt 18pt 20pt 24pt 28pt 32pt",
                    branding: false,
                    promotion: false,
                    resize: false,
                    browser_spellcheck: true,
                    statusbar: true,
                    contextmenu: "link table cell row column deletetable",
                    quickbars_insert_toolbar: "quicktable link",
                    quickbars_selection_toolbar:
                      "bold italic underline | blocks | forecolor backcolor | link",
                    noneditable_class: "mceNonEditable",
                    extended_valid_elements:
                      "span[class|contenteditable|data-token-id|data-case-mode]",
                    content_style: editorContentStyle,
                  }}
                />
              </div>
            )}
          </div>

          {editorView !== "preview" && (
            <aside
              ref={variablesRailContainerRef}
              className={`template-builder-side template-builder-sidebar ${
                isVariablesRailCollapsed
                  ? "template-builder-sidebar--collapsed"
                  : ""
              } template-builder-side--${variablesRailMode}`}
              style={variablesRailContainerStyle}
            >
              <div
                ref={variablesRailFrameRef}
                className="template-builder-sidebar-frame"
                style={variablesRailFrameStyle}
              >
                <section className="template-sidebar-card template-sidebar-card-compact">
                  <div className="template-sidebar-heading">
                    <h3>Змінні</h3>
                    <button
                      type="button"
                      className="template-sidebar-collapse"
                      onClick={() =>
                        setIsVariablesRailCollapsed((current) => !current)
                      }
                      aria-expanded={!isVariablesRailCollapsed}
                      aria-label={
                        isVariablesRailCollapsed
                          ? "Розгорнути панель змінних"
                          : "Згорнути панель змінних"
                      }
                      title={
                        isVariablesRailCollapsed
                          ? "Розгорнути панель змінних"
                          : "Згорнути панель змінних"
                      }
                    >
                      {isVariablesRailCollapsed ? (
                        <PanelRightOpen size={16} />
                      ) : (
                        <PanelRightClose size={16} />
                      )}
                    </button>
                  </div>

                  {!isVariablesRailCollapsed && (
                    <>
                      <div className="template-variable-toolbar">
                        <label className="template-search">
                          <Search size={16} />
                          <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Пошук змінної"
                          />
                        </label>

                        <label className="template-insert-mode">
                          <input
                            type="checkbox"
                            checked={insertGenitive}
                            onChange={(event) =>
                              setInsertGenitive(event.target.checked)
                            }
                          />
                          <span>
                            Відразу вставляти в родовому відмінку, якщо змінна
                            це підтримує
                          </span>
                        </label>
                      </div>

                      <div className="template-variable-groups">
                        {filteredGroups.map((group) => (
                          <section
                            key={group.id}
                            className="template-variable-group"
                          >
                            {(() => {
                              const isExpanded =
                                searchHasValue ||
                                expandedVariableGroups.includes(group.id);

                              return (
                                <>
                                  <button
                                    type="button"
                                    className="template-variable-group-toggle"
                                    onClick={() =>
                                      toggleVariableGroup(group.id)
                                    }
                                    aria-expanded={isExpanded}
                                  >
                                    <div className="template-variable-group-head">
                                      <div>
                                        <h4>{group.label}</h4>
                                        <p>{group.description}</p>
                                      </div>
                                      <div className="template-variable-group-meta">
                                        <span>{group.variables.length}</span>
                                        {isExpanded ? (
                                          <ChevronDown size={16} />
                                        ) : (
                                          <ChevronRight size={16} />
                                        )}
                                      </div>
                                    </div>
                                  </button>

                                  {isExpanded && (
                                    <div className="template-variable-list">
                                      {group.variables.map((variable) => {
                                        const useGenitive =
                                          variable.defaultCaseMode ===
                                            "genitive" ||
                                          (insertGenitive &&
                                            variable.inflection !== "none");
                                        const tokenText = getTemplateTokenText(
                                          variable,
                                          useGenitive,
                                        );
                                        const exampleValue = useGenitive
                                          ? toGenitiveCase(
                                              variable.example,
                                              variable.inflection,
                                            )
                                          : variable.example;

                                        return (
                                          <button
                                            key={variable.id}
                                            type="button"
                                            className="template-variable-row"
                                            onClick={() =>
                                              handleInsertVariable(variable)
                                            }
                                          >
                                            <div className="template-variable-row-top">
                                              <code>{tokenText}</code>
                                              <span className="template-variable-insert">
                                                Вставити
                                              </span>
                                            </div>
                                            <div className="template-variable-row-body">
                                              <strong>{variable.label}</strong>
                                              <span>
                                                {variable.description}
                                              </span>
                                              <small>
                                                Приклад: {exampleValue}
                                              </small>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </section>
                        ))}

                        {filteredGroups.length === 0 && (
                          <div className="template-sidebar-empty">
                            За поточним пошуком змінні не знайдені.
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </section>
              </div>
            </aside>
          )}
        </div>
      </section>
    </div>
  );
};

export default PrintFormsPage;
