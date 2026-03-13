import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { ChevronDown, MoreVertical } from "lucide-react";
import "./RecordActionsMenu.css";

export interface RecordActionItem {
  label: string;
  onClick?: () => void;
  to?: string;
  newTab?: boolean;
  disabled?: boolean;
  danger?: boolean;
}

interface RecordActionsMenuProps {
  actions: RecordActionItem[];
  ariaLabel?: string;
  triggerLabel?: string;
}

const DROPDOWN_OFFSET = 8;
const VIEWPORT_PADDING = 12;
const MIN_DROPDOWN_WIDTH = 192;

export const RecordActionsMenu: React.FC<RecordActionsMenuProps> = ({
  actions,
  ariaLabel = "Дії із записом",
  triggerLabel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const isLabeledTrigger = Boolean(triggerLabel);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({
    top: 0,
    left: 0,
    minWidth: MIN_DROPDOWN_WIDTH,
  });

  const updateDropdownPosition = useCallback(() => {
    if (!containerRef.current || !dropdownRef.current) {
      return;
    }

    const triggerRect = containerRef.current.getBoundingClientRect();
    const dropdownRect = dropdownRef.current.getBoundingClientRect();
    const dropdownWidth = Math.max(
      MIN_DROPDOWN_WIDTH,
      dropdownRect.width || MIN_DROPDOWN_WIDTH,
    );
    const dropdownHeight = dropdownRect.height || 0;

    const canOpenBelow =
      triggerRect.bottom + DROPDOWN_OFFSET + dropdownHeight <=
      window.innerHeight - VIEWPORT_PADDING;
    const canOpenAbove =
      triggerRect.top - DROPDOWN_OFFSET - dropdownHeight >= VIEWPORT_PADDING;

    const top =
      !canOpenBelow && canOpenAbove
        ? triggerRect.top - dropdownHeight - DROPDOWN_OFFSET
        : Math.min(
            triggerRect.bottom + DROPDOWN_OFFSET,
            window.innerHeight - dropdownHeight - VIEWPORT_PADDING,
          );

    const left = Math.min(
      Math.max(VIEWPORT_PADDING, triggerRect.right - dropdownWidth),
      window.innerWidth - dropdownWidth - VIEWPORT_PADDING,
    );

    setMenuStyle({
      top,
      left,
      minWidth: Math.max(MIN_DROPDOWN_WIDTH, triggerRect.width),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    updateDropdownPosition();
    const frameId = window.requestAnimationFrame(updateDropdownPosition);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [actions.length, open, updateDropdownPosition]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedTrigger = containerRef.current?.contains(target);
      const clickedDropdown = dropdownRef.current?.contains(target);

      if (!clickedTrigger && !clickedDropdown) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const handleViewportChange = () => {
      updateDropdownPosition();
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open, updateDropdownPosition]);

  const dropdown = open
    ? createPortal(
        <div
          ref={dropdownRef}
          className="record-actions-dropdown"
          role="menu"
          style={menuStyle}
        >
          {actions.map((action) => {
            const className = `record-actions-item${action.danger ? " danger" : ""}`;
            if (action.to) {
              if (action.newTab) {
                return (
                  <button
                    key={`${action.label}-${action.to}`}
                    type="button"
                    className={className}
                    role="menuitem"
                    disabled={action.disabled}
                    onClick={() => {
                      setOpen(false);

                      const openedWindow = window.open(action.to, "_blank");
                      if (!openedWindow) {
                        window.location.assign(action.to);
                      }
                    }}
                  >
                    {action.label}
                  </button>
                );
              }

              return (
                <Link
                  key={`${action.label}-${action.to}`}
                  to={action.to}
                  className={className}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  {action.label}
                </Link>
              );
            }

            return (
              <button
                key={action.label}
                type="button"
                className={className}
                role="menuitem"
                disabled={action.disabled}
                onClick={() => {
                  setOpen(false);
                  action.onClick?.();
                }}
              >
                {action.label}
              </button>
            );
          })}
        </div>,
        document.body,
      )
    : null;

  return (
    <div ref={containerRef} className="record-actions-menu">
      <button
        type="button"
        className={`record-actions-trigger${isLabeledTrigger ? " record-actions-trigger--labeled" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
      >
        {isLabeledTrigger ? (
          <>
            <span>{triggerLabel}</span>
            <ChevronDown size={16} />
          </>
        ) : (
          <MoreVertical size={18} />
        )}
      </button>

      {dropdown}
    </div>
  );
};

export default RecordActionsMenu;
