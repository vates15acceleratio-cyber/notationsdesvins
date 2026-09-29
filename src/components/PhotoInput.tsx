import { useRef, useState } from "react";

interface PhotoInputProps {
  previewUrl: string | null;
  onFileSelected: (file: File) => void;
  uploading?: boolean;
}

export function PhotoInput({ previewUrl, onFileSelected, uploading }: PhotoInputProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalPreview(URL.createObjectURL(file));
    onFileSelected(file);
  }

  const shown = localPreview ?? previewUrl;

  return (
    <div>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      {shown ? (
        <div className="relative h-48 w-full overflow-hidden rounded-xl">
          <img src={shown} alt="Étiquette" className="h-full w-full object-cover" />
          <div className="absolute bottom-2 right-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="rounded-full bg-black/60 px-3 py-1.5 text-xs text-white"
            >
              📷 Reprendre
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="rounded-full bg-black/60 px-3 py-1.5 text-xs text-white"
            >
              🖼️ Galerie
            </button>
          </div>
          {uploading && (
            <span className="absolute left-2 top-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
              Envoi…
            </span>
          )}
        </div>
      ) : (
        <div className="flex h-48 w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-wine-200 text-wine-700/60">
          <span className="text-3xl">📷</span>
          <span className="text-sm font-medium">Photographier l'étiquette</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="rounded-lg bg-wine-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-wine-800"
            >
              Prendre une photo
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="rounded-lg bg-wine-100 px-3 py-2 text-sm font-medium text-wine-700 transition hover:bg-wine-200"
            >
              Depuis la galerie
            </button>
          </div>
          <span className="text-xs">Optionnel — tu peux l'ajouter plus tard</span>
        </div>
      )}
    </div>
  );
}
