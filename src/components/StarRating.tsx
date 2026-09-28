import { useState } from "react";

interface StarRatingProps {
  value: number | null;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
}

export function StarRating({ value, onChange, size = 28, readOnly = false }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value ?? 0;

  function handleClick(e: React.MouseEvent<HTMLDivElement>, star: number) {
    if (readOnly || !onChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const isHalf = e.clientX - rect.left < rect.width / 2;
    onChange(isHalf ? star - 0.5 : star);
  }

  function handleMove(e: React.MouseEvent<HTMLDivElement>, star: number) {
    if (readOnly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const isHalf = e.clientX - rect.left < rect.width / 2;
    setHover(isHalf ? star - 0.5 : star);
  }

  return (
    <div
      className="inline-flex items-center gap-0.5"
      onMouseLeave={() => setHover(null)}
      role={readOnly ? undefined : "slider"}
      aria-valuenow={value ?? 0}
      aria-valuemin={0}
      aria-valuemax={5}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.min(Math.max(display - (star - 1), 0), 1);
        return (
          <div
            key={star}
            className={readOnly ? "" : "cursor-pointer"}
            style={{ width: size, height: size, position: "relative" }}
            onMouseMove={(e) => handleMove(e, star)}
            onClick={(e) => handleClick(e, star)}
          >
            <svg viewBox="0 0 24 24" width={size} height={size} className="absolute inset-0">
              <path
                d="M12 2.5l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.8-6.2 3.8 1.6-7-5.4-4.8 7.1-.7z"
                fill="none"
                stroke="var(--color-gold-500)"
                strokeWidth="1.2"
              />
            </svg>
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <svg viewBox="0 0 24 24" width={size} height={size}>
                <path
                  d="M12 2.5l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.8-6.2 3.8 1.6-7-5.4-4.8 7.1-.7z"
                  fill="var(--color-gold-500)"
                />
              </svg>
            </div>
          </div>
        );
      })}
      {value != null && (
        <span className="ml-1.5 text-sm font-medium text-wine-700 tabular-nums">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
