'use client';

type MockQrCodeProps = {
  value: string;
  size?: number;
};

/** Deterministic mock QR-style SVG from payload string */
export default function MockQrCode({ value, size = 128 }: MockQrCodeProps) {
  const cells = 11;
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  const modules: boolean[][] = Array.from({ length: cells }, (_, row) =>
    Array.from({ length: cells }, (_, col) => {
      if (
        (row < 3 && col < 3) ||
        (row < 3 && col >= cells - 3) ||
        (row >= cells - 3 && col < 3)
      ) {
        return (row + col) % 2 === 0;
      }
      const seed = Math.abs(hash + row * 17 + col * 31);
      return seed % 3 !== 0;
    }),
  );

  const cellSize = size / cells;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="rounded-lg border border-slate-300 bg-white p-1 shadow-inner"
      aria-label={`QR code for ${value}`}
    >
      <rect width={size} height={size} fill="#ffffff" />
      {modules.map((row, r) =>
        row.map((filled, c) =>
          filled ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#0f172a"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}
