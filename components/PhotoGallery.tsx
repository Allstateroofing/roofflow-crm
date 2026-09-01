"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ImageIcon, Trash2, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PHOTO_CATEGORIES } from "@/lib/constants";
import { useRole } from "@/lib/useRole";
import { can } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/form-shell";

const BUCKET = "job-photos";
const MAX_BYTES = 10 * 1024 * 1024;

type Props =
  | { jobId: string; clientId?: never }
  | { clientId: string; jobId?: never };

/**
 * Fotot e nje pune ose te nje klienti (SPEC §6).
 *
 * Bucket-i eshte privat, ndaj cdo foto shfaqet me nje signed URL me afat.
 * Fshirja lejohet vetem per adminin — te dyja anet, UI dhe RLS.
 */
export default function PhotoGallery({ jobId, clientId }: Props) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("before");
  const [filter, setFilter] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const { role } = useRole();
  const canDelete = can(role, "deletePhotos");

  const load = useCallback(async () => {
    setLoading(true);

    const query = supabase
      .from("job_photos")
      .select("*")
      .order("created_at", { ascending: false });

    const { data, error } = jobId
      ? await query.eq("job_id", jobId)
      : await query.eq("client_id", clientId!);

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    const rows = data || [];
    setPhotos(rows);

    if (rows.length === 0) {
      setUrls({});
      return;
    }

    // Nje signed URL per cdo foto — bucket-i eshte privat.
    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(
        rows.map((r) => r.url),
        60 * 60
      );

    const map: Record<string, string> = {};
    (signed || []).forEach((s, i) => {
      if (s.signedUrl) map[rows[i].url] = s.signedUrl;
    });

    setUrls(map);
  }, [jobId, clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is over 10MB.`);
        continue;
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${jobId ?? clientId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type });

      if (uploadError) {
        toast.error(uploadError.message);
        continue;
      }

      const { error: rowError } = await supabase.from("job_photos").insert({
        job_id: jobId ?? null,
        client_id: clientId ?? null,
        url: path,
        category,
        caption: file.name,
      });

      if (rowError) {
        // Mos e lini skedarin jetim nese rreshti deshton.
        await supabase.storage.from(BUCKET).remove([path]);
        toast.error(rowError.message);
      }
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    toast.success("Photos uploaded");
    load();
  }

  async function remove(photo: any) {
    const { data, error } = await supabase
      .from("job_photos")
      .delete()
      .eq("id", photo.id)
      .select("id");

    setConfirmId(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (!data || data.length === 0) {
      toast.error("Only an admin can delete photos.");
      return;
    }

    await supabase.storage.from(BUCKET).remove([photo.url]);
    toast.success("Photo deleted");
    load();
  }

  const shown = filter ? photos.filter((p) => p.category === filter) : photos;

  const counts = PHOTO_CATEGORIES.map((c) => ({
    ...c,
    n: photos.filter((p) => p.category === c.value).length,
  }));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-32">
          <NativeSelect
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Photo category"
          >
            {PHOTO_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </NativeSelect>
        </div>

        <Button
          variant="outline"
          size="lg"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          <Upload data-icon="inline-start" />
          {uploading ? "Uploading…" : "Add photos"}
        </Button>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          multiple
          hidden
          onChange={(e) => upload(e.target.files)}
        />

        {photos.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilter("")}
              className={
                "rounded-md border px-2 py-1 text-xs transition-colors " +
                (filter === ""
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground")
              }
            >
              All {photos.length}
            </button>

            {counts
              .filter((c) => c.n > 0)
              .map((c) => (
                <button
                  key={c.value}
                  onClick={() => setFilter(c.value)}
                  className={
                    "rounded-md border px-2 py-1 text-xs transition-colors " +
                    (filter === c.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:text-foreground")
                  }
                >
                  {c.label} {c.n}
                </button>
              ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-square animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <ImageIcon className="mx-auto mb-2 size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {photos.length === 0
              ? "No photos yet."
              : "No photos in this category."}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((p) => (
            <li
              key={p.id}
              className="group relative overflow-hidden rounded-lg border border-border bg-muted"
            >
              <a
                href={urls[p.url]}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square"
              >
                {urls[p.url] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={urls[p.url]}
                    alt={p.caption || p.category || "Job photo"}
                    className="size-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <ImageIcon className="size-6 text-muted-foreground" />
                  </div>
                )}
              </a>

              {p.category && (
                <span className="pointer-events-none absolute top-1.5 left-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-white uppercase">
                  {p.category}
                </span>
              )}

              {canDelete &&
                (confirmId === p.id ? (
                  <div className="absolute inset-x-1.5 bottom-1.5 flex gap-1 rounded-lg bg-background/95 p-1 shadow-sm backdrop-blur-sm">
                    <Button
                      variant="destructive"
                      size="xs"
                      className="flex-1"
                      onClick={() => remove(p)}
                    >
                      Delete
                    </Button>
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => setConfirmId(null)}
                    >
                      No
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="icon-xs"
                    aria-label="Delete photo"
                    className="absolute top-1.5 right-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    onClick={() => setConfirmId(p.id)}
                  >
                    <Trash2 />
                  </Button>
                ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
