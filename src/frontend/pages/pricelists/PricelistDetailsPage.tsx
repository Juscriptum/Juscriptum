import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArchiveRestore, Copy, Pencil } from "lucide-react";
import { Alert } from "../../components/Alert";
import { Spinner } from "../../components/Spinner";
import { PageHeader } from "../../components/PageHeader";
import { Breadcrumbs } from "../../components/navigation";
import pricelistService from "../../services/pricelist.service";
import {
  Pricelist,
  PricelistCategory,
  PricelistItem,
  PricelistStatus,
} from "../../types/pricelist.types";
import {
  formatCurrencyAmount,
  formatCurrencyLabel,
} from "../../utils/currency";
import { getErrorMessage } from "../../utils/errors";
import "./PricelistsPage.css";

const CATEGORY_PATH_SEPARATOR = " > ";

interface CategoryViewNode {
  id?: string;
  name: string;
  items: PricelistItem[];
  children: CategoryViewNode[];
}

const formatDate = (value?: string) => {
  if (!value) {
    return "Не вказано";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("uk-UA");
};

const formatMoney = (value: number, currency: string) =>
  formatCurrencyAmount(Number(value || 0), currency, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
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

const buildTree = (
  categories: PricelistCategory[],
  items: PricelistItem[],
): CategoryViewNode[] => {
  const map = new Map<string, CategoryViewNode>();
  const roots: CategoryViewNode[] = [];

  [...categories]
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .forEach((category) => {
      map.set(category.id, {
        id: category.id,
        name: category.name,
        items: [],
        children: [],
      });
    });

  [...categories]
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .forEach((category) => {
      const node = map.get(category.id);
      if (!node) {
        return;
      }

      if (category.parentId) {
        const parent = map.get(category.parentId);
        if (parent) {
          parent.children.push(node);
          return;
        }
      }

      roots.push(node);
    });

  const ensurePath = (path: string[]) => {
    let level = roots;
    let current: CategoryViewNode | null = null;

    path.forEach((segment) => {
      let next = level.find((node) => node.name === segment);
      if (!next) {
        next = { name: segment, items: [], children: [] };
        level.push(next);
      }
      current = next;
      level = next.children;
    });

    return current;
  };

  items.forEach((item) => {
    const path = getItemPath(item);
    const target = ensurePath(path.length > 0 ? path : ["Без категорії"]);
    if (target) {
      target.items.push(item);
    }
  });

  return roots;
};

export const PricelistDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pricelist, setPricelist] = useState<Pricelist | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPricelist = async () => {
    if (!id) {
      setError("Не вдалося визначити прайс");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await pricelistService.getPricelist(id);
      setPricelist(response);
    } catch (err) {
      setError(getErrorMessage(err, "Помилка завантаження прайсу"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPricelist();
  }, [id]);

  const categoryTree = useMemo(
    () =>
      pricelist
        ? buildTree(pricelist.categories || [], pricelist.items || [])
        : [],
    [pricelist],
  );

  const handleStatusChange = async (status: PricelistStatus) => {
    if (!pricelist) {
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      await pricelistService.updatePricelist(pricelist.id, { status });
      await loadPricelist();
    } catch (err) {
      setError(getErrorMessage(err, "Не вдалося оновити статус прайсу"));
    } finally {
      setUpdating(false);
    }
  };

  const handleDuplicate = async () => {
    if (!pricelist) {
      return;
    }

    try {
      const duplicated = await pricelistService.duplicatePricelist(
        pricelist.id,
      );
      navigate(`/pricelists/${duplicated.id}`);
    } catch (err) {
      setError(getErrorMessage(err, "Не вдалося дублювати прайс"));
    }
  };

  const renderCategory = (
    node: CategoryViewNode,
    label: string,
    depth: number,
  ): React.ReactNode => (
    <div
      key={`${node.id || node.name}-${label}`}
      className="pricelist-view-group"
    >
      <div
        className="pricelist-view-group-title"
        style={{ paddingLeft: `calc(1rem + ${depth} * 1rem)` }}
      >
        {`${label}. ${node.name}`}
      </div>

      {node.items.map((item, itemIndex) => (
        <div key={item.id} className="pricelist-view-row">
          <span className="pricelist-view-number">{`${label}.${itemIndex + 1}`}</span>
          <div className="pricelist-view-service">
            <strong>{item.name}</strong>
            {item.description && <p>{item.description}</p>}
            {item.metadata?.note && <small>{item.metadata.note}</small>}
          </div>
          <div className="pricelist-view-meta">
            <span>
              {item.unitType === "hourly"
                ? "Погодинно"
                : item.unitType === "piecewise"
                  ? "Поштучно"
                  : "Фіксовано"}
            </span>
            <strong>
              {formatMoney(item.basePrice, item.currency || "UAH")}
            </strong>
          </div>
        </div>
      ))}

      {node.children.map((child, childIndex) =>
        renderCategory(child, `${label}.${childIndex + 1}`, depth + 1),
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="pricelist-state">
        <Spinner size="large" />
      </div>
    );
  }

  if (!pricelist) {
    return (
      <div className="pricelist-state">
        <Alert type="error" message={error || "Прайс не знайдено"} />
      </div>
    );
  }

  const currency =
    pricelist.metadata?.currency || pricelist.items[0]?.currency || "UAH";

  return (
    <div className="pricelist-details-page">
      <Breadcrumbs
        items={[
          { label: "Головна", to: "/dashboard" },
          { label: "Прайс-листи", to: "/pricelists" },
          { label: pricelist.name },
        ]}
      />

      <PageHeader
        title={`Прайс "${pricelist.name}"`}
        subtitle="Категорії, підкатегорії та послуги прайс-листа"
        actions={
          <>
            <Link
              to={`/pricelists/${pricelist.id}/edit`}
              className="btn btn-outline"
            >
              <Pencil size={18} />
              Редагувати
            </Link>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleDuplicate}
            >
              <Copy size={18} />
              Дублювати
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                handleStatusChange(
                  pricelist.status === "archived" ? "active" : "archived",
                )
              }
              disabled={updating}
            >
              <ArchiveRestore size={18} />
              {pricelist.status === "archived"
                ? "Повернути в активні"
                : "В архів"}
            </button>
          </>
        }
      />

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      <section className="pricelist-summary-grid">
        <div className="content-surface pricelist-summary-card">
          <span>Статус</span>
          <strong>
            {pricelist.status === "archived"
              ? "Архівний"
              : pricelist.status === "inactive"
                ? "Неактивний"
                : "Активний"}
          </strong>
        </div>
        <div className="content-surface pricelist-summary-card">
          <span>Валюта</span>
          <strong>{formatCurrencyLabel(currency)}</strong>
        </div>
        <div className="content-surface pricelist-summary-card">
          <span>Позицій</span>
          <strong>{pricelist.items.length}</strong>
        </div>
        <div className="content-surface pricelist-summary-card">
          <span>Категорій</span>
          <strong>{pricelist.categories?.length || 0}</strong>
        </div>
      </section>

      {pricelist.description && (
        <section className="content-surface pricelist-description-card">
          <p>{pricelist.description}</p>
        </section>
      )}

      <section className="content-surface pricelist-view-card">
        {categoryTree.length === 0 ? (
          <div className="pricelists-empty">
            <h3>У прайсі ще немає позицій</h3>
            <p>Додайте категорії та послуги в режимі редагування.</p>
          </div>
        ) : (
          categoryTree.map((node, index) =>
            renderCategory(node, `${index + 1}`, 0),
          )
        )}
      </section>

      <section className="content-surface pricelist-description-card">
        <p>
          Створено: {formatDate(pricelist.createdAt)}. Оновлено:{" "}
          {formatDate(pricelist.updatedAt)}.
        </p>
      </section>
    </div>
  );
};

export default PricelistDetailsPage;
