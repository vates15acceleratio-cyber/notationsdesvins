import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CommentSection } from "../components/CommentSection";
import { PhotoInput } from "../components/PhotoInput";
import { StarRating } from "../components/StarRating";
import { TastingForm } from "../components/TastingForm";
import { WineTypeBadge } from "../components/WineTypeBadge";
import { useUser } from "../context/UserContext";
import { useWineDetail } from "../hooks/useWineDetail";
import { supabase } from "../lib/supabase";
import { uploadLabelPhoto } from "../lib/uploadPhoto";
import { APPELLATION_SUGGESTIONS, WINE_TYPE_LABELS, type WineType } from "../types";

export function WineDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useUser();
  const { wine, tastings, comments, profiles, loading, refetch } = useWineDetail(id);
  const [editing, setEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (loading) {
    return <p className="p-6 text-center text-wine-700/50">Chargement…</p>;
  }
  if (!wine) {
    return (
      <div className="p-6 text-center text-wine-700/60">
        <p>Ce vin n'existe plus.</p>
        <Link to="/" className="mt-2 inline-block text-wine-700 underline">
          Retour
        </Link>
      </div>
    );
  }

  const myTasting = tastings.find((t) => t.user_id === userId) ?? null;
  const notes = tastings.map((t) => t.note).filter((n): n is number => n != null);
  const averageNote = notes.length ? notes.reduce((a, b) => a + b, 0) / notes.length : null;

  async function handlePhotoChange(file: File) {
    if (!wine) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadLabelPhoto(file, wine.id);
      await supabase.from("wines").update({ photo_url: url }).eq("id", wine.id);
      refetch();
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleDelete() {
    if (!wine) return;
    if (!confirm(`Supprimer la fiche "${wine.name}" ? Cette action est irréversible.`)) return;
    setDeleting(true);
    await supabase.from("wines").delete().eq("id", wine.id);
    navigate("/");
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-10">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-wine-100 bg-wine-50/90 px-4 py-4 backdrop-blur">
        <Link to="/" className="text-xl text-wine-700">
          ←
        </Link>
        <button
          onClick={() => setEditing((v) => !v)}
          className="text-sm font-medium text-wine-700"
        >
          {editing ? "Fermer" : "Modifier la fiche"}
        </button>
      </header>

      <div className="px-4 pt-4">
        <PhotoInput previewUrl={wine.photo_url} onFileSelected={handlePhotoChange} uploading={uploadingPhoto} />
      </div>

      {editing ? (
        <WineEditForm wine={wine} onDone={() => setEditing(false)} refetch={refetch} />
      ) : (
        <div className="px-4 pt-4">
          <h1 className="font-serif text-2xl font-semibold text-wine-900">{wine.name}</h1>
          <p className="mt-0.5 text-wine-700/70">
            {[wine.producer, wine.vintage].filter(Boolean).join(" · ") || "—"}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <WineTypeBadge type={wine.type} />
            {(wine.appellation_type || wine.appellation_name) && (
              <span className="rounded-full bg-gold-500/15 px-2.5 py-1 text-xs font-medium text-gold-500">
                {[wine.appellation_type, wine.appellation_name].filter(Boolean).join(" ")}
              </span>
            )}
            {(wine.region || wine.country) && (
              <span className="rounded-full bg-white px-2.5 py-1 text-xs text-wine-700/70">
                {[wine.region, wine.country].filter(Boolean).join(", ")}
              </span>
            )}
            {wine.grape_varieties && (
              <span className="rounded-full bg-white px-2.5 py-1 text-xs text-wine-700/70">
                {wine.grape_varieties}
              </span>
            )}
            {wine.price != null && (
              <span className="rounded-full bg-white px-2.5 py-1 text-xs text-wine-700/70">
                {wine.price} €
              </span>
            )}
          </div>

          {averageNote != null && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm shadow-wine-900/5">
              <StarRating value={averageNote} readOnly />
              <span className="text-sm text-wine-700/60">note moyenne ({notes.length})</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-4 px-4">
        {userId && <TastingForm wineId={wine.id} userId={userId} existing={myTasting} />}

        {tastings.filter((t) => t.user_id !== userId).length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-wine-700/50">
              Dégustations
            </p>
            {tastings
              .filter((t) => t.user_id !== userId)
              .map((t) => (
                <div key={t.id} className="rounded-2xl bg-white p-4 shadow-sm shadow-wine-900/5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-wine-900">
                      {profiles[t.user_id]?.pseudo ?? "?"}
                    </span>
                    <StarRating value={t.note} readOnly size={20} />
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-wine-700/70">
                    {t.robe_couleur && <Detail label="Robe" value={t.robe_couleur} />}
                    {t.nez_aromes && <Detail label="Nez" value={t.nez_aromes} />}
                    {t.bouche_corps && <Detail label="Corps" value={t.bouche_corps} />}
                    {t.bouche_equilibre && <Detail label="Équilibre" value={t.bouche_equilibre} />}
                  </dl>
                  {t.appreciation && (
                    <p className="mt-2 text-sm italic text-wine-900/80">« {t.appreciation} »</p>
                  )}
                  {t.accord_mets && (
                    <p className="mt-1 text-xs text-wine-700/60">Accord : {t.accord_mets}</p>
                  )}
                </div>
              ))}
          </div>
        )}

        <CommentSection wineId={wine.id} comments={comments} profiles={profiles} />

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="mt-2 self-center text-sm text-red-600/70 hover:text-red-600"
        >
          Supprimer cette fiche
        </button>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-wine-700/40">{label}</dt>
      <dd className="text-wine-900/80">{value}</dd>
    </div>
  );
}

function WineEditForm({
  wine,
  onDone,
  refetch,
}: {
  wine: NonNullable<ReturnType<typeof useWineDetail>["wine"]>;
  onDone: () => void;
  refetch: () => void;
}) {
  const [name, setName] = useState(wine.name);
  const [producer, setProducer] = useState(wine.producer ?? "");
  const [type, setType] = useState<WineType>(wine.type);
  const [vintage, setVintage] = useState(wine.vintage?.toString() ?? "");
  const [region, setRegion] = useState(wine.region ?? "");
  const [country, setCountry] = useState(wine.country ?? "");
  const [appellationType, setAppellationType] = useState(wine.appellation_type ?? "");
  const [appellationName, setAppellationName] = useState(wine.appellation_name ?? "");
  const [grapes, setGrapes] = useState(wine.grape_varieties ?? "");
  const [price, setPrice] = useState(wine.price?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await supabase
      .from("wines")
      .update({
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
        updated_at: new Date().toISOString(),
      })
      .eq("id", wine.id);
    setSaving(false);
    refetch();
    onDone();
  }

  return (
    <div className="flex flex-col gap-3 px-4 pt-4">
      <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Nom du vin" />
      <div className="grid grid-cols-2 gap-3">
        <select value={type} onChange={(e) => setType(e.target.value as WineType)} className="input">
          {Object.entries(WINE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          value={vintage}
          onChange={(e) => setVintage(e.target.value.replace(/\D/g, ""))}
          placeholder="Millésime"
          inputMode="numeric"
          className="input"
        />
      </div>
      <input value={producer} onChange={(e) => setProducer(e.target.value)} placeholder="Producteur" className="input" />
      <div className="grid grid-cols-2 gap-3">
        <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Région" className="input" />
        <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Pays" className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <input
            list="appellation-suggestions-edit"
            value={appellationType}
            onChange={(e) => setAppellationType(e.target.value)}
            placeholder="Mention (AOP, DOCG…)"
            className="input"
          />
          <datalist id="appellation-suggestions-edit">
            {APPELLATION_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <input
          value={appellationName}
          onChange={(e) => setAppellationName(e.target.value)}
          placeholder="Appellation (ex. Bordeaux)"
          className="input"
        />
      </div>
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
        placeholder="Prix (€)"
        inputMode="decimal"
        className="input"
      />
      <input value={grapes} onChange={(e) => setGrapes(e.target.value)} placeholder="Cépage(s)" className="input" />
      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-wine-700 py-2.5 font-medium text-white disabled:opacity-60"
      >
        {saving ? "Enregistrement…" : "Enregistrer"}
      </button>
    </div>
  );
}
