export type WineType = "rouge" | "blanc" | "rose" | "gris" | "petillant" | "liquoreux";

export const WINE_TYPE_LABELS: Record<WineType, string> = {
  rouge: "Rouge",
  blanc: "Blanc",
  rose: "Rosé",
  gris: "Gris",
  petillant: "Pétillant",
  liquoreux: "Liquoreux",
};

export const WINE_TYPE_COLORS: Record<WineType, string> = {
  rouge: "#7b1e3a",
  blanc: "#e8d99a",
  rose: "#e8a2a2",
  gris: "#cfd3d6",
  petillant: "#f0e6b8",
  liquoreux: "#d9a441",
};

// Texte libre (pas une liste fermée) pour couvrir les désignations étrangères :
// DOCG/DOC/IGT (Italie), DOCa/DO (Espagne), AVA (États-Unis), GI (Australie), etc.
export const APPELLATION_SUGGESTIONS = [
  "AOP",
  "AOC",
  "IGP",
  "Vin de France",
  "DOCG",
  "DOC",
  "IGT",
  "DOCa",
  "DO",
  "AVA",
  "GI",
  "Qualitätswein",
];

// Chaque enregistrement porte `updated_at` (fusion : la version la plus récente
// gagne) et `deleted` (une suppression doit elle aussi se propager aux autres).
export interface Profile {
  id: string;
  pseudo: string;
  created_at: string;
  updated_at: string;
}

export interface Wine {
  id: string;
  name: string;
  producer: string | null;
  type: WineType;
  vintage: number | null;
  region: string | null;
  country: string | null;
  appellation_type: string | null;
  appellation_name: string | null;
  grape_varieties: string | null;
  price: number | null;
  // Chemin dans le dépôt de données, ex. "photos/<id>.jpg"
  photo_path: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted: boolean;
}

export interface Tasting {
  id: string;
  wine_id: string;
  user_id: string;
  note: number | null;
  robe_couleur: string | null;
  robe_intensite: string | null;
  robe_limpidite: string | null;
  nez_intensite: string | null;
  nez_qualite: string | null;
  nez_aromes: string | null;
  bouche_attaque: string | null;
  bouche_tanins: string | null;
  bouche_acidite: string | null;
  bouche_sucrosite: string | null;
  bouche_corps: string | null;
  bouche_longueur: string | null;
  bouche_equilibre: string | null;
  appreciation: string | null;
  accord_mets: string | null;
  created_at: string;
  updated_at: string;
  deleted: boolean;
}

export interface Comment {
  id: string;
  wine_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  deleted: boolean;
}
