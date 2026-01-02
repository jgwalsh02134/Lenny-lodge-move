import type { ReactNode } from "react";

type BottomSheetProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function BottomSheet({ title, open, onClose, children }: BottomSheetProps) {
  if (!open) return null;

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheetHeader">
          <div style={{ fontWeight: 900 }}>{title}</div>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="sheetBody">{children}</div>
      </div>
    </>
  );
}


