'use client';

import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  GripVertical,
  LayoutGrid,
  Settings2,
  X,
} from 'lucide-react';
import { useCallback, useState } from 'react';

import type { ConfigurableWidget, ConfigurableWidgetId } from '../../types';

type WidgetConfigToggleProps = {
  widgets: ConfigurableWidget[];
  configOpen: boolean;
  onToggleConfig: () => void;
  onToggleVisibility: (id: ConfigurableWidgetId) => void;
  onMoveUp: (id: ConfigurableWidgetId) => void;
  onMoveDown: (id: ConfigurableWidgetId) => void;
  onReset: () => void;
};

export default function WidgetConfigToggle({
  widgets,
  configOpen,
  onToggleConfig,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  onReset,
}: WidgetConfigToggleProps) {
  const visibleCount = widgets.filter((w) => w.visible).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggleConfig}
        className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all ${
          configOpen
            ? 'border-primary/40 bg-primary-muted text-primary shadow-xs'
            : 'border-slate-200 bg-white text-slate-900 shadow-xs hover:border-slate-300 hover:bg-slate-50'
        }`}
        aria-expanded={configOpen}
        aria-controls="widget-config-panel"
      >
        <LayoutGrid className="h-4 w-4" strokeWidth={2} />
        Custom Dashboard Widgets
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-slate-800">
          {visibleCount}/{widgets.length}
        </span>
        <Settings2 className="h-3.5 w-3.5 opacity-60" />
      </button>

      {configOpen && (
        <>
          <div className="fixed inset-0 z-40" aria-hidden onClick={onToggleConfig} />
          <div
            id="widget-config-panel"
            className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,380px)] animate-fadeIn rounded-2xl border border-slate-200 bg-white p-4 shadow-xl ring-1 ring-slate-900/5"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Widget Configuration</h3>
                <p className="text-[11px] text-slate-800">
                  Show/hide cards · reorder with arrows (mock drag-and-drop)
                </p>
              </div>
              <button
                type="button"
                onClick={onToggleConfig}
                className="rounded-lg p-1 text-slate-800 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close configuration"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ul className="max-h-[320px] space-y-1.5 overflow-y-auto custom-scrollbar">
              {[...widgets]
                .sort((a, b) => a.order - b.order)
                .map((widget, index, sorted) => (
                  <li
                    key={widget.id}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors ${
                      widget.visible
                        ? 'border-slate-200 bg-slate-50/50'
                        : 'border-dashed border-slate-200 bg-white opacity-60'
                    }`}
                  >
                    <GripVertical
                      className="h-4 w-4 shrink-0 cursor-grab text-slate-900"
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{widget.label}</p>
                      <p className="truncate text-[10px] text-slate-800">{widget.description}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => onMoveUp(widget.id)}
                        className="rounded p-1 text-slate-800 hover:bg-white hover:text-slate-800 disabled:opacity-30"
                        aria-label={`Move ${widget.label} up`}
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === sorted.length - 1}
                        onClick={() => onMoveDown(widget.id)}
                        className="rounded p-1 text-slate-800 hover:bg-white hover:text-slate-800 disabled:opacity-30"
                        aria-label={`Move ${widget.label} down`}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleVisibility(widget.id)}
                        className={`rounded-lg p-1.5 ${
                          widget.visible
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                        }`}
                        aria-label={widget.visible ? `Hide ${widget.label}` : `Show ${widget.label}`}
                      >
                        {widget.visible ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </li>
                ))}
            </ul>

            <button
              type="button"
              onClick={onReset}
              className="mt-3 w-full rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50"
            >
              Reset to defaults
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function useWidgetConfig(initialWidgets: ConfigurableWidget[]) {
  const [widgets, setWidgets] = useState(initialWidgets);

  const toggleVisibility = useCallback((id: ConfigurableWidgetId) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)),
    );
  }, []);

  const moveUp = useCallback((id: ConfigurableWidgetId) => {
    setWidgets((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((w) => w.id === id);
      if (idx <= 0) return prev;
      const reordered = [...sorted];
      [reordered[idx - 1], reordered[idx]] = [reordered[idx], reordered[idx - 1]];
      return reordered.map((w, i) => ({ ...w, order: i }));
    });
  }, []);

  const moveDown = useCallback((id: ConfigurableWidgetId) => {
    setWidgets((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((w) => w.id === id);
      if (idx < 0 || idx >= sorted.length - 1) return prev;
      const reordered = [...sorted];
      [reordered[idx], reordered[idx + 1]] = [reordered[idx + 1], reordered[idx]];
      return reordered.map((w, i) => ({ ...w, order: i }));
    });
  }, []);

  const reset = useCallback(() => {
    setWidgets(initialWidgets);
  }, [initialWidgets]);

  return { widgets, toggleVisibility, moveUp, moveDown, reset };
}
