"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { C } from "@/lib/theme";

interface ToastItem {
  id: number;
  message: string;
  tone: "success" | "error" | "info";
}

interface ToastContextValue {
  show: (message: string, tone?: ToastItem["tone"]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

let counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, tone: ToastItem["tone"] = "success") => {
    const id = ++counter;
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => {
          const Icon = t.tone === "success" ? CheckCircle2 : t.tone === "error" ? AlertTriangle : Info;
          const color = t.tone === "success" ? C.green : t.tone === "error" ? C.red : C.blue;
          return (
            <div
              key={t.id}
              className="flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-[13px] font-medium shadow-lg"
              style={{ border: `1px solid ${color}33`, color: C.ink }}
            >
              <Icon size={16} style={{ color }} />
              {t.message}
              <button onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}>
                <X size={14} style={{ color: C.slateSoft }} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
