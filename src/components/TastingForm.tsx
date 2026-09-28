import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Tasting } from "../types";
import { StarRating } from "./StarRating";

interface TastingFormProps {
  wineId: string;
  userId: string;
  existing: Tasting | null;
}

type FormState = {
  note: number | null;
  robe_couleur: string;
  robe_intensite: string;
  robe_limpidite: string;
  nez_intensite: string;
  nez_qualite: string;
  nez_aromes: string;
  bouche_attaque: string;
  bouche_tanins: string;
  bouche_acidite: string;
  bouche_sucrosite: string;
  bouche_corps: string;
  bouche_longueur: string;
  bouche_equilibre: string;
  appreciation: string;
  accord_mets: string;
};

const empty: FormState = {
  note: null,
  robe_couleur: "",
  robe_intensite: "",
  robe_limpidite: "",
  nez_intensite: "",
  nez_qualite: "",
  nez_aromes: "",
  bouche_attaque: "",
  bouche_tanins: "",
  bouche_acidite: "",
  bouche_sucrosite: "",
  bouche_corps: "",
  bouche_longueur: "",
  bouche_equilibre: "",
  appreciation: "",
  accord_mets: "",
};

function fromExisting(t: Tasting | null): FormState {
  if (!t) return empty;
  return {
    note: t.note,
    robe_couleur: t.robe_couleur ?? "",
    robe_intensite: t.robe_intensite ?? "",
    robe_limpidite: t.robe_limpidite ?? "",
    nez_intensite: t.nez_intensite ?? "",
    nez_qualite: t.nez_qualite ?? "",
    nez_aromes: t.nez_aromes ?? "",
    bouche_attaque: t.bouche_attaque ?? "",
    bouche_tanins: t.bouche_tanins ?? "",
    bouche_acidite: t.bouche_acidite ?? "",
    bouche_sucrosite: t.bouche_sucrosite ?? "",
    bouche_corps: t.bouche_corps ?? "",
    bouche_longueur: t.bouche_longueur ?? "",
    bouche_equilibre: t.bouche_equilibre ?? "",
    appreciation: t.appreciation ?? "",
    accord_mets: t.accord_mets ?? "",
  };
}

export function TastingForm({ wineId, userId, existing }: TastingFormProps) {
  const [form, setForm] = useState<FormState>(fromExisting(existing));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [open, setOpen] = useState(!existing);

  useEffect(() => {
    setForm(fromExisting(existing));
  }, [existing]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      wine_id: wineId,
      user_id: userId,
      note: form.note,
      robe_couleur: form.robe_couleur || null,
      robe_intensite: form.robe_intensite || null,
      robe_limpidite: form.robe_limpidite || null,
      nez_intensite: form.nez_intensite || null,
      nez_qualite: form.nez_qualite || null,
      nez_aromes: form.nez_aromes || null,
      bouche_attaque: form.bouche_attaque || null,
      bouche_tanins: form.bouche_tanins || null,
      bouche_acidite: form.bouche_acidite || null,
      bouche_sucrosite: form.bouche_sucrosite || null,
      bouche_corps: form.bouche_corps || null,
      bouche_longueur: form.bouche_longueur || null,
      bouche_equilibre: form.bouche_equilibre || null,
      appreciation: form.appreciation || null,
      accord_mets: form.accord_mets || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("tastings").upsert(payload, { onConflict: "wine_id,user_id" });
    setSaving(false);
    if (!error) {
      setSavedAt(Date.now());
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-sm shadow-wine-900/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-wine-700/70">Ma dégustation</p>
            <div className="mt-1">
              <StarRating value={form.note} readOnly />
            </div>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg bg-wine-100 px-3 py-1.5 text-sm font-medium text-wine-700 hover:bg-wine-200"
          >
            Modifier
          </button>
        </div>
        {savedAt && <p className="mt-2 text-xs text-green-700">Enregistré ✓</p>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm shadow-wine-900/5">
      <p className="mb-3 text-sm font-semibold text-wine-800">Ma dégustation</p>

      <div className="mb-4 flex items-center justify-between rounded-lg bg-wine-50 px-3 py-3">
        <span className="text-sm font-medium text-wine-700/80">Note</span>
        <StarRating value={form.note} onChange={(v) => set("note", v)} />
      </div>

      <Section title="Robe">
        <TextField label="Couleur" value={form.robe_couleur} onChange={(v) => set("robe_couleur", v)} placeholder="Rubis, or, rose saumon…" />
        <div className="grid grid-cols-2 gap-2">
          <SelectField
            label="Intensité"
            value={form.robe_intensite}
            onChange={(v) => set("robe_intensite", v)}
            options={["Pâle", "Moyenne", "Soutenue"]}
          />
          <SelectField
            label="Limpidité"
            value={form.robe_limpidite}
            onChange={(v) => set("robe_limpidite", v)}
            options={["Limpide", "Trouble"]}
          />
        </div>
      </Section>

      <Section title="Nez">
        <div className="grid grid-cols-2 gap-2">
          <SelectField
            label="Intensité"
            value={form.nez_intensite}
            onChange={(v) => set("nez_intensite", v)}
            options={["Discret", "Moyen", "Intense"]}
          />
          <SelectField
            label="Qualité"
            value={form.nez_qualite}
            onChange={(v) => set("nez_qualite", v)}
            options={["Simple", "Complexe", "Fin"]}
          />
        </div>
        <TextField label="Arômes" value={form.nez_aromes} onChange={(v) => set("nez_aromes", v)} placeholder="Fruits rouges, épices, vanille…" />
      </Section>

      <Section title="Bouche">
        <div className="grid grid-cols-2 gap-2">
          <SelectField
            label="Attaque"
            value={form.bouche_attaque}
            onChange={(v) => set("bouche_attaque", v)}
            options={["Souple", "Vive", "Franche"]}
          />
          <SelectField
            label="Tanins"
            value={form.bouche_tanins}
            onChange={(v) => set("bouche_tanins", v)}
            options={["Absents", "Souples", "Fermes", "Astringents"]}
          />
          <SelectField
            label="Acidité"
            value={form.bouche_acidite}
            onChange={(v) => set("bouche_acidite", v)}
            options={["Faible", "Équilibrée", "Vive"]}
          />
          <SelectField
            label="Sucrosité"
            value={form.bouche_sucrosite}
            onChange={(v) => set("bouche_sucrosite", v)}
            options={["Sec", "Demi-sec", "Moelleux", "Liquoreux"]}
          />
          <SelectField
            label="Corps"
            value={form.bouche_corps}
            onChange={(v) => set("bouche_corps", v)}
            options={["Léger", "Moyen", "Charpenté"]}
          />
          <SelectField
            label="Longueur"
            value={form.bouche_longueur}
            onChange={(v) => set("bouche_longueur", v)}
            options={["Courte", "Moyenne", "Longue", "Persistante"]}
          />
        </div>
        <SelectField
          label="Équilibre général"
          value={form.bouche_equilibre}
          onChange={(v) => set("bouche_equilibre", v)}
          options={["Déséquilibré", "Correct", "Harmonieux"]}
        />
      </Section>

      <Section title="Appréciation">
        <TextArea label="Commentaire de dégustation" value={form.appreciation} onChange={(v) => set("appreciation", v)} />
        <TextField label="Accord mets-vin suggéré" value={form.accord_mets} onChange={(v) => set("accord_mets", v)} placeholder="Viande rouge, fromage affiné…" />
      </Section>

      <div className="mt-2 flex gap-2">
        {existing && (
          <button
            onClick={() => {
              setForm(fromExisting(existing));
              setOpen(false);
            }}
            className="flex-1 rounded-lg bg-wine-100 py-2.5 font-medium text-wine-700"
          >
            Annuler
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-lg bg-wine-700 py-2.5 font-medium text-white hover:bg-wine-800 disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer ma dégustation"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-wine-700/50">{title}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-wine-700/60">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input" />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-wine-700/60">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="input resize-none" />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-wine-700/60">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input">
        <option value="">—</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
