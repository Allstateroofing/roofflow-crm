"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/** Faqe forme: titull, nentitull, kthim mbrapa dhe kartela e permbajtjes. */
export function FormPage({
  title,
  description,
  backHref,
  children,
}: {
  title: string;
  description?: string;
  backHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      {backHref && (
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}

/** Rresht fushash: 1 kolone ne mobile, 2 ne desktop kur kalohet `cols={2}`. */
export function FormGrid({
  cols = 1,
  className,
  children,
}: {
  cols?: 1 | 2;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid gap-5",
        cols === 2 && "sm:grid-cols-2",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Nje fushe: etikete + kontroll + ndihmese/gabim. */
export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** Butonat ne fund, te ndare me nje vije. */
export function FormActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 flex items-center justify-end gap-3 border-t border-border pt-6">
      {children}
    </div>
  );
}

/** <select> vendas me pamjen e Input-it — ruan onChange standard. */
export function NativeSelect({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          "h-9 w-full appearance-none rounded-lg border border-input bg-transparent px-2.5 py-1 pr-8 text-base transition-colors outline-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "md:text-sm dark:bg-input/30",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}
