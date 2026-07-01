"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Star, X } from "lucide-react";

/**
 * Manages a list of image URLs. Uploads files to /api/upload (Cloudinary → ImgBB)
 * and appends the resulting URLs. The first image is treated as the primary/cover.
 */
export function MultiImageUpload({
  value,
  onChange,
  label = "Images",
  max = 6,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadOne(file: File): Promise<string | null> {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Upload failed.");
    return data.url as string;
  }

  async function handleFiles(files: FileList) {
    setError(null);
    const room = max - value.length;
    if (room <= 0) { setError(`You can add up to ${max} images.`); return; }
    const chosen = Array.from(files).slice(0, room);
    setUploading(true);
    const added: string[] = [];
    try {
      for (const f of chosen) {
        const url = await uploadOne(f);
        if (url) added.push(url);
      }
      onChange([...value, ...added]);
    } catch (e) {
      if (added.length) onChange([...value, ...added]);
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  function makeCover(i: number) {
    if (i === 0) return;
    const next = [...value];
    const [img] = next.splice(i, 1);
    onChange([img, ...next]);
  }

  return (
    <div className="space-y-2">
      <span className="text-xs text-vodium-cream/40">{label} <span className="text-vodium-cream/25">· first image is the cover</span></span>
      <div className="flex flex-wrap gap-2">
        {value.map((url, i) => (
          <div key={url + i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/[0.08] group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover" />
            {i === 0 && <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-center text-vodium-gold py-0.5">Cover</span>}
            <button type="button" onClick={() => remove(i)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black">
              <X size={11} />
            </button>
            {i !== 0 && (
              <button type="button" onClick={() => makeCover(i)} title="Make cover" className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black opacity-0 group-hover:opacity-100">
                <Star size={11} />
              </button>
            )}
          </div>
        ))}

        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-20 h-20 rounded-lg border border-dashed border-white/15 flex flex-col items-center justify-center gap-1 text-vodium-cream/40 hover:text-vodium-gold hover:border-vodium-gold/40 disabled:opacity-50"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
            <span className="text-[10px]">{uploading ? "…" : "Add"}</span>
          </button>
        )}
      </div>
      <p className="text-[11px] text-vodium-cream/30">JPG, PNG, WebP or GIF · up to 5 MB each · max {max}</p>
      {error && <p className="text-xs text-rose-300">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}
