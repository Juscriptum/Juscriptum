import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Eye, FolderPlus, Plus, Save, Trash2 } from "lucide-react";
import { Alert } from "../../components/Alert";
import { Spinner } from "../../components/Spinner";
import { PageHeader } from "../../components/PageHeader";
import { Breadcrumbs } from "../../components/navigation";
import pricelistService from "../../services/pricelist.service";
import {
  CreatePricelistItemDto,
  Pricelist,
  PricelistCategory,
  PricelistItem,
  PricelistItemUnitType,
  PricelistType,
} from "../../types/pricelist.types";
import { formatCurrencyLabel } from "../../utils/currency";
import { getErrorMessage } from "../../utils/errors";
import "./PricelistsPage.css";

interface EditorItem {
  id?: string;
  tempId: string;
  name: string;
  description: string;
  basePrice: string;
  unitType: PricelistItemUnitType;
  code: string;
  note: string;
}

interface EditorCategoryNode {
  id?: string;
  tempId: string;
  parentId?: string | null;
  name: string;
  items: EditorItem[];
  children: EditorCategoryNode[];
}

interface FlatEditorItemPayload {
  id?: string;
  payload: CreatePricelistItemDto;
}

interface FlatCategoryNode {
  node: EditorCategoryNode;
  parentTempId?: string;
  path: string[];
  depth: number;
  displayOrder: number;
}

type DragPlacement = "before" | "inside" | "after";

interface DragState {
  draggedId: string | null;
  overId: string | null;
  placement: DragPlacement | null;
}

const CATEGORY_PATH_SEPARATOR = " > ";
const PRICELIST_TYPE_OPTIONS: Array<{ value: PricelistType; label: string }> = [
  { value: "general", label: "Загальний" },
  { value: "consultation", label: "Консультації" },
  { value: "court", label: "Судова практика" },
  { value: "document", label: "Документи" },
  { value: "other", label: "Інше" },
];

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яіїєґ]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);

const createTempId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createEmptyItem = (): EditorItem => ({
  tempId: createTempId(),
  name: "",
  description: "",
  basePrice: "",
  unitType: "fixed",
  code: "",
  note: "",
});

const createEmptyCategoryNode = (
  parentId?: string | null,
): EditorCategoryNode => ({
  tempId: createTempId(),
  parentId: parentId ?? null,
  name: "",
  items: [],
  children: [],
});

const getItemPath = (item: PricelistItem): string[] => {
  const metadataPath = item.metadata?.categoryPath;

  if (Array.isArray(metadataPath) && metadataPath.length > 0) {
    return metadataPath.map((part) => String(part).trim()).filter(Boolean);
  }

  return String(item.category || "")
    .split(CATEGORY_PATH_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean);
};

const attachItemsByPath = (
  roots: EditorCategoryNode[],
  items: PricelistItem[],
) => {
  const findByPath = (
    nodes: EditorCategoryNode[],
    path: string[],
  ): EditorCategoryNode | null => {
    let level = nodes;
    let current: EditorCategoryNode | null = null;

    for (const segment of path) {
      const next = level.find((node) => node.name === segment);
      if (!next) {
        return null;
      }
      current = next;
      level = next.children;
    }

    return current;
  };

  const ensurePath = (path: string[]) => {
    let level = roots;
    let parentId: string | null = null;
    let current: EditorCategoryNode | null = null;

    path.forEach((segment) => {
      let next = level.find((node) => node.name === segment);
      if (!next) {
        next = createEmptyCategoryNode(parentId);
        next.name = segment;
        level.push(next);
      }
      current = next;
      parentId = next.id ?? null;
      level = next.children;
    });

    return current;
  };

  items.forEach((item) => {
    const path = getItemPath(item);
    const target = findByPath(roots, path) || ensurePath(path) || roots[0];

    target.items.push({
      id: item.id,
      tempId: createTempId(),
      name: item.name || "",
      description: item.description || "",
      basePrice: item.basePrice ? String(item.basePrice) : "",
      unitType: item.unitType || "fixed",
      code: item.code || "",
      note: item.metadata?.note || "",
    });
  });
};

const buildTreeFromCategories = (
  categories: PricelistCategory[],
  items: PricelistItem[],
): EditorCategoryNode[] => {
  const sorted = [...categories].sort(
    (left, right) => left.displayOrder - right.displayOrder,
  );
  const nodeMap = new Map<string, EditorCategoryNode>();
  const roots: EditorCategoryNode[] = [];

  sorted.forEach((category) => {
    nodeMap.set(category.id, {
      id: category.id,
      tempId: category.id,
      parentId: category.parentId ?? null,
      name: category.name,
      items: [],
      children: [],
    });
  });

  sorted.forEach((category) => {
    const node = nodeMap.get(category.id);
    if (!node) {
      return;
    }

    if (category.parentId) {
      const parent = nodeMap.get(category.parentId);
      if (parent) {
        parent.children.push(node);
        return;
      }
    }

    roots.push(node);
  });

  attachItemsByPath(roots, items);

  return roots;
};

const buildTreeFromItems = (items: PricelistItem[]): EditorCategoryNode[] => {
  const roots: EditorCategoryNode[] = [];
  attachItemsByPath(roots, items);
  return roots;
};

const mapItemToPayload = (
  path: string[],
  item: EditorItem,
  index: number,
  currency: string,
): CreatePricelistItemDto => ({
  name: item.name.trim(),
  code:
    item.code.trim() ||
    `${path.map(slugify).join("_")}_${slugify(item.name) || index + 1}`,
  description: item.description.trim() || undefined,
  category: path.join(CATEGORY_PATH_SEPARATOR),
  unitType: item.unitType,
  basePrice: Number(item.basePrice || 0),
  currency,
  displayOrder: index,
  metadata: {
    ...(item.note.trim() ? { note: item.note.trim() } : {}),
    categoryPath: path,
    treeDepth: Math.max(path.length - 1, 0),
  },
});

const updateCategoryTree = (
  nodes: EditorCategoryNode[],
  categoryId: string,
  updater: (node: EditorCategoryNode) => EditorCategoryNode,
): EditorCategoryNode[] =>
  nodes.map((node) => {
    if (node.tempId === categoryId) {
      return updater(node);
    }

    return {
      ...node,
      children: updateCategoryTree(node.children, categoryId, updater),
    };
  });

const removeCategoryTreeNode = (
  nodes: EditorCategoryNode[],
  categoryId: string,
): EditorCategoryNode[] =>
  nodes
    .filter((node) => node.tempId !== categoryId)
    .map((node) => ({
      ...node,
      children: removeCategoryTreeNode(node.children, categoryId),
    }));

const treeContainsNode = (
  node: EditorCategoryNode,
  targetId: string,
): boolean => {
  if (node.tempId === targetId) {
    return true;
  }

  return node.children.some((child) => treeContainsNode(child, targetId));
};

const extractCategoryNode = (
  nodes: EditorCategoryNode[],
  categoryId: string,
): { extracted: EditorCategoryNode | null; tree: EditorCategoryNode[] } => {
  let extracted: EditorCategoryNode | null = null;

  const tree = nodes
    .filter((node) => {
      if (node.tempId === categoryId) {
        extracted = node;
        return false;
      }

      return true;
    })
    .map((node) => {
      const childResult = extractCategoryNode(node.children, categoryId);
      if (childResult.extracted) {
        extracted = childResult.extracted;
      }

      return {
        ...node,
        children: childResult.tree,
      };
    });

  return { extracted, tree };
};

const insertCategoryNode = (
  nodes: EditorCategoryNode[],
  targetId: string,
  draggedNode: EditorCategoryNode,
  placement: DragPlacement,
): EditorCategoryNode[] => {
  const targetIndex = nodes.findIndex((node) => node.tempId === targetId);

  if (targetIndex >= 0) {
    if (placement === "inside") {
      return nodes.map((node) =>
        node.tempId === targetId
          ? {
              ...node,
              children: [
                ...node.children,
                { ...draggedNode, parentId: node.id ?? null },
              ],
            }
          : node,
      );
    }

    const nextNodes = [...nodes];
    const target = nodes[targetIndex];
    const insertIndex = placement === "before" ? targetIndex : targetIndex + 1;
    nextNodes.splice(insertIndex, 0, {
      ...draggedNode,
      parentId: target.parentId ?? null,
    });
    return nextNodes;
  }

  return nodes.map((node) => ({
    ...node,
    children: insertCategoryNode(
      node.children,
      targetId,
      draggedNode,
      placement,
    ),
  }));
};

const normalizeCategoryTree = (
  nodes: EditorCategoryNode[],
): EditorCategoryNode[] =>
  nodes
    .map((node) => ({
      ...node,
      name: node.name.trim(),
      items: node.items.filter(
        (item) =>
          item.name.trim().length > 0 || item.basePrice.trim().length > 0,
      ),
      children: normalizeCategoryTree(node.children),
    }))
    .filter(
      (node) =>
        node.name.length > 0 ||
        node.items.length > 0 ||
        node.children.length > 0,
    );

const flattenCategoryTree = (
  nodes: EditorCategoryNode[],
  parentTempId?: string,
  path: string[] = [],
  depth = 0,
): FlatCategoryNode[] =>
  nodes.flatMap((node, index) => {
    const nextPath = [...path, node.name.trim() || "Без категорії"];

    return [
      { node, parentTempId, path: nextPath, depth, displayOrder: index },
      ...flattenCategoryTree(node.children, node.tempId, nextPath, depth + 1),
    ];
  });

const flattenItemsForSave = (
  nodes: EditorCategoryNode[],
  currency: string,
  path: string[] = [],
): FlatEditorItemPayload[] =>
  nodes.flatMap((node) => {
    const nextPath = [...path, node.name.trim() || "Без категорії"];
    const ownItems = node.items
      .filter(
        (item) =>
          item.name.trim().length > 0 || item.basePrice.trim().length > 0,
      )
      .map((item, index) => ({
        id: item.id,
        payload: mapItemToPayload(nextPath, item, index, currency),
      }));

    return [
      ...ownItems,
      ...flattenItemsForSave(node.children, currency, nextPath),
    ];
  });

export const PricelistEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [pageLoading, setPageLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingPricelist, setExistingPricelist] = useState<Pricelist | null>(
    null,
  );
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<PricelistType>("general");
  const [currency, setCurrency] = useState("UAH");
  const [vatIncluded, setVatIncluded] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [categories, setCategories] = useState<EditorCategoryNode[]>([
    createEmptyCategoryNode(),
  ]);
  const [dragState, setDragState] = useState<DragState>({
    draggedId: null,
    overId: null,
    placement: null,
  });

  useEffect(() => {
    const loadPage = async () => {
      if (!id) {
        return;
      }

      try {
        setPageLoading(true);
        setError(null);
        const pricelist = await pricelistService.getPricelist(id);
        const nextTree =
          pricelist.categories?.length > 0
            ? buildTreeFromCategories(pricelist.categories, pricelist.items)
            : buildTreeFromItems(pricelist.items);

        setExistingPricelist(pricelist);
        setName(pricelist.name);
        setDescription(pricelist.description || "");
        setType(pricelist.type);
        setCurrency(
          pricelist.metadata?.currency || pricelist.items[0]?.currency || "UAH",
        );
        setVatIncluded(pricelist.vatIncluded);
        setIsDefault(pricelist.isDefault);
        setCategories(
          nextTree.length > 0 ? nextTree : [createEmptyCategoryNode()],
        );
      } catch (err) {
        setError(getErrorMessage(err, "Помилка завантаження прайсу"));
      } finally {
        setPageLoading(false);
      }
    };

    loadPage();
  }, [id]);

  const normalizedCategories = useMemo(
    () => normalizeCategoryTree(categories),
    [categories],
  );
  const previewNodes = useMemo(
    () => flattenCategoryTree(normalizedCategories),
    [normalizedCategories],
  );

  const handleCategoryChange = (categoryId: string, nextName: string) => {
    setCategories((current) =>
      updateCategoryTree(current, categoryId, (node) => ({
        ...node,
        name: nextName,
      })),
    );
  };

  const handleItemChange = (
    categoryId: string,
    itemId: string,
    key: keyof EditorItem,
    value: string,
  ) => {
    setCategories((current) =>
      updateCategoryTree(current, categoryId, (node) => ({
        ...node,
        items: node.items.map((item) =>
          item.tempId === itemId ? { ...item, [key]: value } : item,
        ),
      })),
    );
  };

  const addRootCategory = () => {
    setCategories((current) => [...current, createEmptyCategoryNode()]);
  };

  const addSubcategory = (categoryId: string) => {
    setCategories((current) =>
      updateCategoryTree(current, categoryId, (node) => ({
        ...node,
        children: [...node.children, createEmptyCategoryNode(node.id ?? null)],
      })),
    );
  };

  const addService = (categoryId: string) => {
    setCategories((current) =>
      updateCategoryTree(current, categoryId, (node) => ({
        ...node,
        items: [...node.items, createEmptyItem()],
      })),
    );
  };

  const removeCategory = (categoryId: string) => {
    setCategories((current) => {
      const next = removeCategoryTreeNode(current, categoryId);
      return next.length > 0 ? next : [createEmptyCategoryNode()];
    });
  };

  const removeItem = (categoryId: string, itemId: string) => {
    setCategories((current) =>
      updateCategoryTree(current, categoryId, (node) => ({
        ...node,
        items: node.items.filter((item) => item.tempId !== itemId),
      })),
    );
  };

  const handleSave = async () => {
    const normalizedName = name.trim();
    const validCategories = normalizeCategoryTree(categories);
    const categoryNodes = flattenCategoryTree(validCategories);
    const itemPayloads = flattenItemsForSave(validCategories, currency);

    if (!normalizedName) {
      setError("Вкажіть назву прайсу");
      return;
    }

    if (itemPayloads.length === 0) {
      setError(
        "Добавьте хотя бы одну услугу в любую категорию или подкатегорию",
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: normalizedName,
        description: description.trim() || undefined,
        type,
        status: existingPricelist?.status || "active",
        isDefault,
        vatIncluded,
        vatRate: vatIncluded ? 0.2 : 0,
        metadata: { ...(existingPricelist?.metadata || {}), currency },
      };

      const savedPricelist =
        isEdit && id
          ? await pricelistService.updatePricelist(id, payload)
          : await pricelistService.createPricelist(payload);

      const existingCategories = existingPricelist?.categories || [];
      const keptCategoryIds = new Set(
        categoryNodes.map(({ node }) => node.id).filter(Boolean) as string[],
      );
      const deletedCategoryRoots = existingCategories.filter(
        (category) =>
          !keptCategoryIds.has(category.id) &&
          (!category.parentId || keptCategoryIds.has(category.parentId)),
      );

      const categoryIdMap = new Map<string, string>();
      for (const {
        node,
        parentTempId,
        path,
        depth,
        displayOrder,
      } of categoryNodes) {
        const parentId = parentTempId
          ? categoryIdMap.get(parentTempId)
          : undefined;
        const categoryPayload = {
          name: node.name,
          parentId,
          displayOrder,
          metadata: {
            pathSegments: path,
            treeDepth: depth,
          },
        };

        if (node.id) {
          const updated = await pricelistService.updateCategory(
            node.id,
            categoryPayload,
          );
          categoryIdMap.set(node.tempId, updated.id);
        } else {
          const created = await pricelistService.addCategory(
            savedPricelist.id,
            categoryPayload,
          );
          categoryIdMap.set(node.tempId, created.id);
        }
      }

      for (const category of deletedCategoryRoots) {
        await pricelistService.deleteCategory(category.id);
      }

      const existingItemsById = new Map(
        (existingPricelist?.items || []).map((item) => [item.id, item]),
      );
      const keptItemIds = new Set(
        itemPayloads.map((item) => item.id).filter(Boolean) as string[],
      );

      for (const existingItem of existingPricelist?.items || []) {
        if (!keptItemIds.has(existingItem.id)) {
          await pricelistService.deleteItem(existingItem.id);
        }
      }

      for (const [index, item] of itemPayloads.entries()) {
        const payloadWithOrder = {
          ...item.payload,
          displayOrder: index,
        };

        if (item.id && existingItemsById.has(item.id)) {
          await pricelistService.updateItem(item.id, payloadWithOrder);
        } else {
          await pricelistService.addItem(savedPricelist.id, payloadWithOrder);
        }
      }

      navigate(`/pricelists/${savedPricelist.id}`);
    } catch (err) {
      setError(getErrorMessage(err, "Не вдалося зберегти прайс"));
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (categoryId: string) => {
    setDragState({
      draggedId: categoryId,
      overId: null,
      placement: null,
    });
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLElement>,
    categoryId: string,
    placement: DragPlacement,
  ) => {
    event.preventDefault();
    setDragState((current) => ({
      ...current,
      overId: categoryId,
      placement,
    }));
  };

  const handleDrop = (targetId: string, placement: DragPlacement) => {
    setCategories((current) => {
      if (!dragState.draggedId || dragState.draggedId === targetId) {
        return current;
      }

      const extraction = extractCategoryNode(current, dragState.draggedId);
      if (!extraction.extracted) {
        return current;
      }

      if (treeContainsNode(extraction.extracted, targetId)) {
        return current;
      }

      return insertCategoryNode(
        extraction.tree,
        targetId,
        extraction.extracted,
        placement,
      );
    });

    setDragState({
      draggedId: null,
      overId: null,
      placement: null,
    });
  };

  const clearDragState = () => {
    setDragState({
      draggedId: null,
      overId: null,
      placement: null,
    });
  };

  const renderCategoryNode = (
    category: EditorCategoryNode,
    depth: number,
    pathLabel: string,
  ) => (
    <article
      key={category.tempId}
      className="pricelist-category-card"
      style={{ ["--pricelist-depth" as string]: String(depth) }}
      draggable
      onDragStart={() => handleDragStart(category.tempId)}
      onDragEnd={clearDragState}
    >
      <button
        type="button"
        className={`pricelist-drop-zone ${dragState.overId === category.tempId && dragState.placement === "before" ? "active" : ""}`}
        onDragOver={(event) => handleDragOver(event, category.tempId, "before")}
        onDrop={() => handleDrop(category.tempId, "before")}
        aria-label="Перемістити перед категорією"
      />
      <div className="pricelist-category-header">
        <div className="pricelist-category-index">{pathLabel}</div>
        <div className="pricelist-category-name">
          <input
            className="form-input"
            value={category.name}
            onChange={(event) =>
              handleCategoryChange(category.tempId, event.target.value)
            }
            placeholder={depth === 0 ? "Назва категорії" : "Назва підкатегорії"}
          />
          <span className="pricelist-category-depth-label">
            {depth === 0 ? "Категорія" : `Підкатегорія рівня ${depth}`}
          </span>
        </div>
        <button
          type="button"
          className="pricelists-icon-btn danger"
          onClick={() => removeCategory(category.tempId)}
          aria-label="Видалити категорію"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <button
        type="button"
        className={`pricelist-drop-zone inside ${dragState.overId === category.tempId && dragState.placement === "inside" ? "active" : ""}`}
        onDragOver={(event) => handleDragOver(event, category.tempId, "inside")}
        onDrop={() => handleDrop(category.tempId, "inside")}
        aria-label="Перемістити в середину категорії"
      >
        Перемістити сюди
      </button>

      <div className="pricelist-category-actions">
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => addSubcategory(category.tempId)}
        >
          <FolderPlus size={18} />
          Створити підкатегорію
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => addService(category.tempId)}
        >
          <Plus size={18} />
          Створити послугу
        </button>
      </div>

      {category.items.length > 0 && (
        <div className="pricelist-items-list">
          {category.items.map((item, itemIndex) => (
            <div key={item.tempId} className="pricelist-item-card">
              <div className="pricelist-item-number">{`${pathLabel}.${itemIndex + 1}`}</div>
              <div className="pricelist-item-fields">
                <input
                  className="form-input"
                  value={item.name}
                  onChange={(event) =>
                    handleItemChange(
                      category.tempId,
                      item.tempId,
                      "name",
                      event.target.value,
                    )
                  }
                  placeholder="Назва послуги"
                />
                <input
                  className="form-input"
                  value={item.description}
                  onChange={(event) =>
                    handleItemChange(
                      category.tempId,
                      item.tempId,
                      "description",
                      event.target.value,
                    )
                  }
                  placeholder="Опис або умови"
                />
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.basePrice}
                  onChange={(event) =>
                    handleItemChange(
                      category.tempId,
                      item.tempId,
                      "basePrice",
                      event.target.value,
                    )
                  }
                  placeholder="Ціна"
                />
                <select
                  className="form-select"
                  value={item.unitType}
                  onChange={(event) =>
                    handleItemChange(
                      category.tempId,
                      item.tempId,
                      "unitType",
                      event.target.value,
                    )
                  }
                >
                  <option value="fixed">Фіксована</option>
                  <option value="hourly">Погодинна</option>
                  <option value="piecewise">Поштучна</option>
                </select>
                <input
                  className="form-input"
                  value={item.note}
                  onChange={(event) =>
                    handleItemChange(
                      category.tempId,
                      item.tempId,
                      "note",
                      event.target.value,
                    )
                  }
                  placeholder="Примітка до позиції"
                />
              </div>
              <button
                type="button"
                className="pricelists-icon-btn danger"
                onClick={() => removeItem(category.tempId, item.tempId)}
                aria-label="Видалити послугу"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {category.children.length > 0 && (
        <div className="pricelist-children-list">
          {category.children.map((child, childIndex) =>
            renderCategoryNode(
              child,
              depth + 1,
              `${pathLabel}.${childIndex + 1}`,
            ),
          )}
        </div>
      )}

      <button
        type="button"
        className={`pricelist-drop-zone ${dragState.overId === category.tempId && dragState.placement === "after" ? "active" : ""}`}
        onDragOver={(event) => handleDragOver(event, category.tempId, "after")}
        onDrop={() => handleDrop(category.tempId, "after")}
        aria-label="Перемістити після категорії"
      />
    </article>
  );

  if (pageLoading) {
    return (
      <div className="pricelist-state">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="pricelist-editor-page">
      <Breadcrumbs
        items={[
          { label: "Головна", to: "/dashboard" },
          { label: "Прайс-листи", to: "/pricelists" },
          { label: isEdit ? "Редагування прайсу" : "Додавання нового прайсу" },
        ]}
      />

      <PageHeader
        title={
          isEdit
            ? `Редагування прайсу "${name || "Без назви"}"`
            : "Додавання нового прайсу"
        }
        subtitle="Налаштуйте структуру та послуги прайс-листа"
        actions={
          <>
            {isEdit && id && (
              <Link to={`/pricelists/${id}`} className="btn btn-outline">
                <Eye size={18} />
                До перегляду
              </Link>
            )}
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setPreviewOpen((value) => !value)}
            >
              <Eye size={18} />
              {previewOpen ? "Сховати перегляд" : "Попередній перегляд"}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={18} />
              {saving
                ? "Збереження..."
                : isEdit
                  ? "Зберегти зміни"
                  : "Зберегти прайс"}
            </button>
          </>
        }
      />

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      <section className="content-surface pricelist-settings-card">
        <div className="pricelist-section-heading">
          <h2>Глобальні налаштування</h2>
          <p>Назва, опис, тип прайсу, валюта та ПДВ.</p>
        </div>

        <div className="pricelist-settings-grid">
          <label className="form-group">
            <span className="form-label">Назва прайсу</span>
            <input
              className="form-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Наприклад, Обслуговування юридичних осіб"
            />
          </label>
          <label className="form-group">
            <span className="form-label">Тип прайсу</span>
            <select
              className="form-select"
              value={type}
              onChange={(event) => setType(event.target.value as PricelistType)}
            >
              {PRICELIST_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-group">
            <span className="form-label">Валюта</span>
            <select
              className="form-select"
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
            >
              <option value="UAH">грн</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
          <label className="form-group">
            <span className="form-label">ПДВ</span>
            <select
              className="form-select"
              value={vatIncluded ? "included" : "excluded"}
              onChange={(event) =>
                setVatIncluded(event.target.value === "included")
              }
            >
              <option value="included">З ПДВ</option>
              <option value="excluded">Без ПДВ</option>
            </select>
          </label>
          <label className="form-group pricelist-settings-description">
            <span className="form-label">Опис прайсу</span>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Коротко опишіть сферу застосування або коментарі до прайсу"
            />
          </label>
          <label className="pricelist-checkbox">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(event) => setIsDefault(event.target.checked)}
            />
            <span>Використовувати як прайс за замовчуванням</span>
          </label>
        </div>
      </section>

      <section className="content-surface pricelist-editor-card">
        <div className="pricelist-section-heading pricelist-section-heading-row">
          <div>
            <h2>Категорії, підкатегорії та послуги</h2>
            <p>
              Категории хранятся отдельно, услуги привязываются к пути
              категории.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={addRootCategory}
          >
            <FolderPlus size={18} />
            Додати категорію
          </button>
        </div>

        <div className="pricelist-category-list">
          {categories.map((category, categoryIndex) =>
            renderCategoryNode(category, 0, `${categoryIndex + 1}`),
          )}
        </div>
      </section>

      {previewOpen && (
        <section className="content-surface pricelist-preview-card">
          <div className="pricelist-section-heading">
            <h2>Попередній перегляд</h2>
            <p>
              Так дерево категорій і послуг буде виглядати в режимі перегляду.
            </p>
          </div>

          <div className="pricelist-preview-sheet">
            <h3>{name || "Новий прайс"}</h3>
            {previewNodes.map(({ node, depth }, categoryIndex) => (
              <div key={node.tempId} className="pricelist-preview-group">
                <div
                  className="pricelist-preview-group-title"
                  style={{ paddingLeft: `calc(1rem + ${depth} * 1rem)` }}
                >
                  {`${categoryIndex + 1}. ${node.name || "Без категорії"}`}
                </div>
                {node.items.map((item, itemIndex) => (
                  <div key={item.tempId} className="pricelist-preview-row">
                    <span>{`${categoryIndex + 1}.${itemIndex + 1}`}</span>
                    <div>
                      <strong>{item.name || "Нова послуга"}</strong>
                      {item.description && <p>{item.description}</p>}
                      {item.note && <small>{item.note}</small>}
                    </div>
                    <span>
                      {item.basePrice
                        ? `${Number(item.basePrice).toLocaleString("uk-UA")} ${formatCurrencyLabel(currency)}`
                        : "Ціна не вказана"}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default PricelistEditorPage;
