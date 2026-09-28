import { WINE_TYPE_COLORS, WINE_TYPE_LABELS, type WineType } from "../types";

export function WineTypeBadge({ type }: { type: WineType }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-wine-900"
      style={{ backgroundColor: `${WINE_TYPE_COLORS[type]}33` }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: WINE_TYPE_COLORS[type] }}
      />
      {WINE_TYPE_LABELS[type]}
    </span>
  );
}
