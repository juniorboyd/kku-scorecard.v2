"use client";
import { createContext, useContext, useState, useCallback, useRef, useMemo } from "react";
import { X, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";

type Variant = "success" | "error" | "delete";
type ToastItem = { id: number; message: string; variant: Variant };

interface ToastCtx {
  success: (message: string) => void;
  error: (message: string) => void;
  /** Red confirmation for destructive actions (delete/remove). */
  deleted: (message: string) => void;
}

const ToastContext = createContext<ToastCtx>({ success: () => {}, error: () => {}, deleted: () => {} });

const STYLES: Record<Variant, { bg: string; Icon: typeof CheckCircle2 }> = {
  success: { bg: "bg-green-600", Icon: CheckCircle2 },
  error:   { bg: "bg-red-600",   Icon: AlertCircle },
  delete:  { bg: "bg-red-600",   Icon: Trash2 },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message: string, variant: Variant) => {
    const id = ++idRef.current;
    setToasts((list) => [...list, { id, message, variant }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  const success = useCallback((m: string) => push(m, "success"), [push]);
  const error = useCallback((m: string) => push(m, "error"), [push]);
  const deleted = useCallback((m: string) => push(m, "delete"), [push]);
  const value = useMemo(() => ({ success, error, deleted }), [success, error, deleted]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast stack (bottom-right) */}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2">
        {toasts.map((t) => {
          const { bg, Icon } = STYLES[t.variant];
          return (
            <div
              key={t.id}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white animate-slide-in-right ${bg}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{t.message}</span>
              <button onClick={() => remove(t.id)} className="ml-1 opacity-70 hover:opacity-100">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
