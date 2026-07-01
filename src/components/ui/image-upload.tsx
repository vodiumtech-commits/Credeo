"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, X } from "lucide-react";

/**
 * Image picker: uploads a file to /api/upload (Cloudinary → ImgBB) and returns
 * the hosted URL via onChange. Falls back to pasting a URL if uploads aren't
 * configured. `value` is the current image URL (or null).
 */
export function ImageUpload({
  value,
  onChange,
  label = "Image",
  shape = "square",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  shape?: "square" | "wide";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasteMode, setPasteMode] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        if (res.status === 503) setPasteMode(true);
        return;
      }
      onChange(data.url);
    } catch {
      setError("Upload failed. Try again or paste a URL.");
      setPasteMode(true);
    } finally {
      setUploading(false);
    }
  }

  const previewClass = shape === "wide" ? "w-full h-32" : "w-24 h-24";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-vodium-cream/40">{label}</span>
        <button type="button" onClick={() => setPasteMode((v) => !v)} className="text-[11px] text-vodium-cream/40 hover:text-vodium-gold inline-flex items-center gap-1">
          <Link2 size={11} /> {pasteMode ? "Upload a file" : "Paste a URL"}
        </button>
      </div>

      <div className="flex items-start gap-3">
        <div className={`${previewClass} rounded-lg border border-white/[0.08] bg-black/25 overflow-hidden flex items-center justify-center shrink-0 relative`}>
          {value ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => onChange(null)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black">
                <X size={12} />
              </button>
            </>
          ) : (
            <ImagePlus size={22} className="text-vodium-cream/25" />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          {pasteMode ? (
            <input
              defaultValue={value ?? ""}
              onBlur={(e) => onChange(e.target.value.trim() || null)}
              placeholder="https://…/image.jpg"
              className="w-full bg-black/25 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-vodium-cream placeholder:text-vodium-cream/25 focus:outline-none focus:border-vodium-gold/40"
            />
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="px-3 py-2 rounded-lg border border-white/10 text-xs text-vodium-cream/70 hover:text-vodium-gold hover:border-vodium-gold/30 inline-flex items-center gap-2 disabled:opacity-50"
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
              {uploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
            </button>
          )}
          <p className="text-[11px] text-vodium-cream/30">JPG, PNG, WebP or GIF · up to 5 MB</p>
          {error && <p className="text-xs text-rose-300">{error}</p>}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
