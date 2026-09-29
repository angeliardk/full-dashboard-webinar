"use client";

import React from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { C } from "@/lib/theme";

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  widthClassName = "max-w-2xl",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  widthClassName?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]" />
        <Dialog.Popup
          className={`fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[92vw] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-0 shadow-2xl ${widthClassName}`}
        >
          <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b bg-white px-5 py-4" style={{ borderColor: C.line }}>
            <div>
              <Dialog.Title className="text-base font-bold" style={{ color: C.ink }}>{title}</Dialog.Title>
              {description && <Dialog.Description className="mt-0.5 text-[12.5px]" style={{ color: C.slate }}>{description}</Dialog.Description>}
            </div>
            <Dialog.Close className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Tutup">
              <X size={18} style={{ color: C.slate }} />
            </Dialog.Close>
          </div>
          <div className="px-5 py-4">{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Konfirmasi",
  danger,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} widthClassName="max-w-md">
      <div className="text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>{description}</div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={() => onOpenChange(false)}
          className="rounded-lg border px-3 py-2 text-[13px] font-semibold"
          style={{ borderColor: C.line, color: C.inkSoft }}
        >
          Batal
        </button>
        <button
          onClick={() => { onConfirm(); onOpenChange(false); }}
          className="rounded-lg px-3 py-2 text-[13px] font-semibold text-white"
          style={{ background: danger ? C.red : C.blue }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
