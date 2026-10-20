import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PhotoInput } from "../components/PhotoInput";
import { useUser } from "../context/UserContext";
import { createWine, updateWine } from "../lib/data";
import { saveLabelPhoto } from "../lib/photos";
import { APPELLATION_SUGGESTIONS, WINE_TYPE_LABELS, type WineType } from "../types";

export function NewWine() {
  const navigate = useNavigate();
  const { userId } = useUser();
  const [name, setName] = useState("");
  const [producer, setProducer] = useState("");
  const [type, setType] = useState<WineType>("rouge");
  const [vintage, setVintage] = useState("");
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("");
  const [appellationType, setAppellationType] = useState("");
  const [appellationName, setAppellationName] = useState("");
  const [grapes, setGrapes] = useState("");
  const [price, setPrice] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !userId) {
      setError("Le nom du vin est obligatoire.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const wine = await createWine(
        {
          name: name.trim(),
          producer: producer.trim() || null,
          type,
          vintage: vintage ? Number(vintage) : null,
          region: region.trim() || null,
          country: country.trim() || null,
          appellation_type: appellationType.trim() || null,
          appellation_name: appellationName.trim() || null,
          grape_varieties: grapes.trim() || null,
          price: price ? Number(price) : null,
          photo_path: null,
        },
        userId
      );

      // La photo est facultative et ne bloque jamais la création de la fiche.
      if (photoFile) {
        try {
          const path = await saveLabelPhoto(photoFile, wine.id);
          await updateWine(wine.id, { photo_path: path });
        } catch (photoError) {
          console.error("Échec de l'enregistrement de la photo :", photoError);
        }
      }

      navigate(`/vins/${wine.id}`);
    } catch (err) {
      console.error(err);
      setError("Impossible de créer la fiche, réessaie.");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-16">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-wine-100 bg-wine-50/90 px-4 py-4 backdrop-blur">
        <Link to="/" className="text-xl text-wine-700">
          ←
        </Link>
        <h1 className="font-serif text-xl font-semibold text-wine-900">Nouveau vin</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 py-5">
        <PhotoInput previewUrl={null} onFileSelected={setPhotoFile} />

        <Field label="Nom du vin *">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex. Château Fontaine"
            className="input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <select value={type} onChange={(e) => setType(e.target.value as WineType)} className="input">
              {Object.entries(WINE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Millésime">
            <input
              value={vintage}
              onChange={(e) => setVintage(e.target.value.replace(/\D/g, ""))}
              placeholder="2020"
              inputMode="numeric"
              maxLength={4}
              className="input"
            />
          </Field>
        </div>

        <Field label="Producteur / Domaine">
          <input value={producer} onChange={(e) => setProducer(e.target.value)} className="input" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Région">
            <input value={region} onChange={(e) => setRegion(e.target.value)} className="input" />
          </Field>
          <Field label="Pays">
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Ex. Italie, Espagne…"
              className="input"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Mention">
            <input
              list="appellation-suggestions"
              value={appellationType}
              onChange={(e) => setAppellationType(e.target.value)}
              placeholder="AOP, DOCG, AVA…"
              className="input"
            />
            <datalist id="appellation-suggestions">
              {APPELLATION_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>
          <Field label="Appellation">
            <input
              value={appellationName}
              onChange={(e) => setAppellationName(e.target.value)}
              placeholder="Ex. Bordeaux, Chianti…"
              className="input"
            />
          </Field>
        </div>

        <Field label="Prix (€)">
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
            inputMode="decimal"
            className="input"
          />
        </Field>

        <Field label="Cépage(s)">
          <input
            value={grapes}
            onChange={(e) => setGrapes(e.target.value)}
            placeholder="Ex. Merlot, Cabernet Sauvignon"
            className="input"
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-2 rounded-lg bg-wine-700 py-3 font-medium text-white transition hover:bg-wine-800 disabled:opacity-60"
        >
          {saving ? "Création…" : "Créer la fiche"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-wine-700/80">{label}</span>
      {children}
    </label>
  );
}
