"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { JOB_STATUSES, ZIP_TONES, zipArea } from "@/lib/constants";

/** Titull faqeje me pershkrim dhe nje veprim kryesor djathtas. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/** Rreshti i kerkimit/filtrave mbi tabele. */
export function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">{children}</div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export type Column<T> = {
  key: string;
  header: string;
  align?: "left" | "right";
  cell: (row: T) => React.ReactNode;
  /** Ne mobile behet titulli i kartes ne vend te nje rreshti etikete/vlere. */
  primary?: boolean;
  /** Ne mobile shkon poshte, i ndare me nje vije. */
  actions?: boolean;
  /** Fshihet krejt ne ekrane te vegjel. */
  hideOnMobile?: boolean;
};

/**
 * Nje perkufizim kolonash, dy paraqitje:
 * tabele nga `md:` e siper, karta me poshte.
 */
export function DataTable<T>({
  columns,
  rows,
  getKey,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string;
  empty: React.ReactNode;
}) {
  if (rows.length === 0) return <>{empty}</>;

  const primary = columns.find((c) => c.primary);
  const actions = columns.filter((c) => c.actions);
  const details = columns.filter(
    (c) => !c.primary && !c.actions && !c.hideOnMobile
  );

  return (
    <>
      {/* ---------- Desktop ---------- */}
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-xs font-medium whitespace-nowrap text-muted-foreground",
                    c.align === "right" ? "text-right" : "text-left",
                    c.primary ? "w-full" : "w-px"
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr
                key={getKey(row)}
                className="transition-colors hover:bg-muted/40"
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "px-4 py-3 align-middle",
                      c.align === "right" && "text-right tabular-nums",
                      c.primary ? "w-full" : "w-px whitespace-nowrap"
                    )}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------- Mobile ---------- */}
      <ul className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <li
            key={getKey(row)}
            className="rounded-xl border border-border bg-card p-4"
          >
            {primary && (
              <div className="mb-3 text-sm font-medium">
                {primary.cell(row)}
              </div>
            )}

            <dl className="grid gap-1.5 text-sm">
              {details.map((c) => (
                <div key={c.key} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{c.header}</dt>
                  <dd className="text-right font-medium tabular-nums">
                    {c.cell(row)}
                  </dd>
                </div>
              ))}
            </dl>

            {actions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                {actions.map((c) => (
                  <React.Fragment key={c.key}>{c.cell(row)}</React.Fragment>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

/** Kuti statistike per raportet. */
export function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "negative";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums",
          tone === "positive" && "text-emerald-600 dark:text-emerald-400",
          tone === "negative" && "text-destructive"
        )}
      >
        {value}
      </div>
    </div>
  );
}

const STATUS_TONES: Record<string, string> = {
  done: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
  active:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
  scheduled:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900",
  estimate_sent:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900",
  cancelled:
    "bg-destructive/10 text-destructive border-destructive/20",
  new: "bg-muted text-muted-foreground border-border",
  disabled: "bg-muted text-muted-foreground border-border",
};
/** Etikete statusi me ngjyre sipas kuptimit; e panjohura bie te neutralja. */
export function StatusBadge({ value }: { value?: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;

  const key = String(value).toLowerCase().replace(/\s+/g, "_");
  const tone = STATUS_TONES[key] ?? "bg-muted text-muted-foreground border-border";
  // Emri vjen nga e njejta liste si kudo tjeter, qe te mos dalin dy emra
  // per te njejtin status (p.sh. "scheduled" te shenja dhe "Job to do" te lista).
  const known = JOB_STATUSES.find((s) => s.value === key)?.label;
  const label = known ?? String(value).replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-medium",
        // Emrat e njohur vijne tashme te shkruar sic duhet ("Job to do");
        // vetem vlerat e panjohura kane nevoje per shkronjen e madhe.
        !known && "capitalize",
        tone
      )}
    >
      {label}
    </span>
  );
}

/** ZIP-i me ngjyren e zones se vet, qe rreshtat te dallohen me nje veshtrim. */
export function ZipBadge({ value }: { value?: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;

  const tone = ZIP_TONES[zipArea(value)];

  // Zone jashte listes — tekst i thjeshte, qe te mos ngaterrohet me griun e 19-es.
  if (!tone) {
    return (
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {value}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-xs font-medium tabular-nums",
        tone
      )}
    >
      {value}
    </span>
  );
}
