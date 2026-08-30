import {
  useEffect,
  useId,
  useRef,
  type DialogHTMLAttributes,
  type ReactNode,
} from "react";
import "./ui.css";

export interface DialogProps extends Omit<
  DialogHTMLAttributes<HTMLDialogElement>,
  "open"
> {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  actions?: ReactNode;
  closeLabel?: string;
  onClose: () => void;
}

export function Dialog({
  open,
  title,
  description,
  children,
  actions,
  closeLabel = "Tutup dialog",
  onClose,
  className = "",
  ...props
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      previouslyFocusedRef.current =
        document.activeElement as HTMLElement | null;
      dialog.showModal();
      dialog.focus();
    }

    if (!open && dialog.open) {
      dialog.close();
      previouslyFocusedRef.current?.focus();
      previouslyFocusedRef.current = null;
    }
  }, [open]);

  useEffect(
    () => () => {
      previouslyFocusedRef.current?.focus();
    },
    [],
  );

  return (
    <dialog
      ref={dialogRef}
      className={`ui-dialog ${className}`.trim()}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      tabIndex={-1}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={() => {
        if (open) onClose();
      }}
      {...props}
    >
      <div className="ui-dialog__header">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className="ui-dialog__close"
          aria-label={closeLabel}
          onClick={onClose}
        >
          ×
        </button>
      </div>
      {description && <p id={descriptionId}>{description}</p>}
      {children}
      {actions && <div className="ui-dialog__actions">{actions}</div>}
    </dialog>
  );
}
