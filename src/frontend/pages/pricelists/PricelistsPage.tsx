import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Alert } from "../../components/Alert";
import { Spinner } from "../../components/Spinner";
import { PageHeader } from "../../components/PageHeader";
import { RecordActionsMenu } from "../../components/RecordActionsMenu";
import { Breadcrumbs } from "../../components/navigation";
import pricelistService from "../../services/pricelist.service";
import { Pricelist, PricelistStatus } from "../../types/pricelist.types";
import { formatCurrencyLabel } from "../../utils/currency";
import { getErrorMessage } from "../../utils/errors";
import "./PricelistsPage.css";

type PricelistTab = "active" | "archived";

const formatDate = (value?: string) => {
  if (!value) {
    return "Не вказано";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("uk-UA");
};

const formatDescription = (pricelist: Pricelist) => {
  const raw = pricelist.description?.trim();
  if (raw) {
    return raw;
  }

  const categoryCount = new Set(
    pricelist.items.map((item) => item.category).filter(Boolean),
  ).size;
  if (categoryCount > 0) {
    return `${categoryCount} категорій, ${pricelist.items.length} послуг`;
  }

  return "Опис відсутній";
};

export const PricelistsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<Pricelist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const tab = (searchParams.get("tab") as PricelistTab | null) || "active";

  const loadPricelists = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pricelistService.getPricelists({
        status: tab === "archived" ? "archived" : "active",
        search: search.trim() || undefined,
        page: 1,
        limit: 100,
      });
      setRows(response.data);
    } catch (err) {
      setError(getErrorMessage(err, "Помилка завантаження прайсів"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPricelists();
  }, [tab]);

  const filteredRows = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return rows;
    }

    return rows.filter((item) => {
      const haystack = [
        item.name,
        item.description,
        item.type,
        ...item.items.map(
          (priceItem) =>
            `${priceItem.category} ${priceItem.name} ${priceItem.description || ""}`,
        ),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [rows, search]);

  const handleTabChange = (nextTab: PricelistTab) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", nextTab);
    if (search.trim()) {
      nextParams.set("search", search.trim());
    } else {
      nextParams.delete("search");
    }
    setSearchParams(nextParams, { replace: true });
  };

  const handleSearchSubmit = () => {
    const nextParams = new URLSearchParams(searchParams);
    if (search.trim()) {
      nextParams.set("search", search.trim());
    } else {
      nextParams.delete("search");
    }
    setSearchParams(nextParams, { replace: true });
    loadPricelists();
  };

  const handleArchiveToggle = async (pricelist: Pricelist) => {
    const nextStatus: PricelistStatus =
      pricelist.status === "archived" ? "active" : "archived";
    const prompt =
      nextStatus === "archived"
        ? `Архівувати прайс "${pricelist.name}"?`
        : `Повернути прайс "${pricelist.name}" до активних?`;

    if (!window.confirm(prompt)) {
      return;
    }

    try {
      await pricelistService.updatePricelist(pricelist.id, {
        status: nextStatus,
      });
      await loadPricelists();
    } catch (err) {
      setError(getErrorMessage(err, "Помилка зміни статусу прайсу"));
    }
  };

  const handleDuplicate = async (pricelist: Pricelist) => {
    try {
      const duplicated = await pricelistService.duplicatePricelist(
        pricelist.id,
      );
      navigate(`/pricelists/${duplicated.id}`);
    } catch (err) {
      setError(getErrorMessage(err, "Не вдалося дублювати прайс"));
    }
  };

  const handleDelete = async (pricelist: Pricelist) => {
    if (
      !window.confirm(
        `Видалити прайс "${pricelist.name}"? Цю дію не можна швидко скасувати.`,
      )
    ) {
      return;
    }

    try {
      await pricelistService.deletePricelist(pricelist.id);
      await loadPricelists();
    } catch (err) {
      setError(getErrorMessage(err, "Не вдалося видалити прайс"));
    }
  };

  return (
    <div className="pricelists-page">
      <Breadcrumbs />

      <PageHeader
        title="Прайс-листи"
        subtitle="Керуйте активними та архівними прайсами для різних напрямів практики"
        actions={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/pricelists/add")}
          >
            <Plus size={18} />
            Додати прайс
          </button>
        }
      />

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      <section className="content-surface pricelists-toolbar">
        <div
          className="pricelists-tabs"
          role="tablist"
          aria-label="Стани прайсів"
        >
          <button
            type="button"
            className={`pricelists-tab ${tab === "active" ? "active" : ""}`}
            onClick={() => handleTabChange("active")}
          >
            Актуальні прайси
          </button>
          <button
            type="button"
            className={`pricelists-tab ${tab === "archived" ? "active" : ""}`}
            onClick={() => handleTabChange("archived")}
          >
            Архівні прайси
          </button>
        </div>

        <div className="pricelists-search">
          <label className="pricelists-search-field">
            <Search size={18} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearchSubmit();
                }
              }}
              placeholder="Пошук за назвою, описом або послугами"
            />
          </label>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleSearchSubmit}
          >
            Знайти
          </button>
        </div>
      </section>

      <section className="content-surface pricelists-table-wrap">
        {loading ? (
          <div className="pricelists-loading">
            <Spinner size="large" />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="pricelists-empty">
            <h3>Прайси не знайдено</h3>
            <p>
              {tab === "archived"
                ? "У вас ще немає архівних прайсів."
                : "Створіть перший прайс, щоб почати роботу з цінами."}
            </p>
            {tab === "active" && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate("/pricelists/add")}
              >
                <Plus size={18} />
                Додати прайс
              </button>
            )}
          </div>
        ) : (
          <div className="pricelists-table">
            <div className="pricelists-table-head">
              <span>Назва прайсу</span>
              <span>Дата створення</span>
              <span>
                {tab === "archived" ? "Дата архівації" : "Дата зміни"}
              </span>
              <span>Опис</span>
              <span className="pricelists-actions-cell">Дії</span>
            </div>

            {filteredRows.map((pricelist) => (
              <article key={pricelist.id} className="pricelists-row">
                <div className="pricelists-row-main">
                  <Link
                    to={`/pricelists/${pricelist.id}`}
                    className="pricelists-row-title"
                  >
                    {pricelist.name}
                  </Link>
                  <div className="pricelists-row-meta">
                    <span>{pricelist.items.length} позицій</span>
                    <span>
                      {formatCurrencyLabel(pricelist.metadata?.currency)}
                    </span>
                    {pricelist.isDefault && <span>Основний</span>}
                  </div>
                </div>
                <span>{formatDate(pricelist.createdAt)}</span>
                <span>{formatDate(pricelist.updatedAt)}</span>
                <p className="pricelists-row-description">
                  {formatDescription(pricelist)}
                </p>
                <div className="pricelists-row-actions">
                  <RecordActionsMenu
                    actions={[
                      {
                        label: "Переглянути",
                        to: `/pricelists/${pricelist.id}`,
                      },
                      ...(tab !== "archived"
                        ? [
                            {
                              label: "Редагувати",
                              to: `/pricelists/${pricelist.id}/edit`,
                            },
                          ]
                        : []),
                      {
                        label: "Дублювати",
                        onClick: () => handleDuplicate(pricelist),
                      },
                      {
                        label: tab === "archived" ? "Відновити" : "Архівувати",
                        onClick: () => handleArchiveToggle(pricelist),
                      },
                      ...(tab !== "archived"
                        ? [
                            {
                              label: "Видалити",
                              onClick: () => handleDelete(pricelist),
                              danger: true,
                            },
                          ]
                        : []),
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
};

export default PricelistsPage;
