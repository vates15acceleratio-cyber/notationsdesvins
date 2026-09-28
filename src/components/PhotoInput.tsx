import { useRef, useState } from "react";

interface PhotoInputProps {
  previewUrl: string | null;
  onFileSelected: (file: File) => void;
  uploading?: boolean;
}

export function PhotoInput({ previewUrl, onFileSelected, uploading }: PhotoInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
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
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />
      {shown ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative block h-48 w-full overflow-hidden rounded-xl"
        >
          <img src={shown} alt="Étiquette" className="h-full w-full object-cover" />
          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
            {uploading ? "Envoi…" : "Changer la photo"}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-wine-200 text-wine-700/60 transition hover:border-wine-600/40 hover:text-wine-700"
        >
          <span className="text-3xl">📷</span>
          <span className="text-sm font-medium">Photographier l'étiquette</span>
          <span className="text-xs">Optionnel — tu peux l'ajouter plus tard</span>
        </button>
      )}
    </div>
  );
}
