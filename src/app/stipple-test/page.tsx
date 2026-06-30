// diagonal = original 2×2 SVG (dots at (0,0) and (1,1))
// diag4 = 4×4 SVG with 1px dots at (0,0) and (2,2) — same diagonal spacing, half-size dot
const DIAGONAL_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2' shape-rendering='crispEdges'%3E%3Crect width='2' height='2' fill='%23ffffff'/%3E%3Crect x='0' y='0' width='1' height='1' fill='%23000000'/%3E%3Crect x='1' y='1' width='1' height='1' fill='%23000000'/%3E%3C/svg%3E")`;
const DIAG4_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' shape-rendering='crispEdges'%3E%3Crect width='4' height='4' fill='%23ffffff'/%3E%3Crect x='0' y='0' width='1' height='1' fill='%23000000'/%3E%3Crect x='2' y='2' width='1' height='1' fill='%23000000'/%3E%3C/svg%3E")`;

const variants = [
  // winner candidate — same diagonal spacing as 4px but 1px dots
  { label: "★ Diagonal 4px spacing / 1px dot (DIAG4 @ 4px)", svg: DIAG4_SVG, size: "4px 4px" },
  { label: "★ Diagonal 4px spacing / 1px dot (DIAG4 @ 6px)", svg: DIAG4_SVG, size: "6px 6px" },
  { label: "★ Diagonal 4px spacing / 1px dot (DIAG4 @ 8px)", svg: DIAG4_SVG, size: "8px 8px" },
  // original diagonal at different scales (2px dots each)
  { label: "Original diagonal @ 3px (1.5px dots)", svg: DIAGONAL_SVG, size: "3px 3px" },
  { label: "Original diagonal @ 4px (2px dots) ← you picked this", svg: DIAGONAL_SVG, size: "4px 4px" },
  { label: "Original diagonal @ 6px (3px dots)", svg: DIAGONAL_SVG, size: "6px 6px" },
];

export default function StippleTest() {
  return (
    <div className="min-h-screen bg-paper p-12 space-y-10">
      <h1 className="font-serif text-3xl text-ink">Stipple variants</h1>
      {variants.map((v) => (
        <div key={v.label} className="space-y-2">
          <p className="label text-ink-muted">{v.label}</p>
          <div
            className="relative h-8 w-full max-w-lg border-y border-ink-muted/50"
            style={{
              backgroundColor: "#ffffff",
              backgroundImage: v.svg,
              backgroundSize: v.size,
              imageRendering: "pixelated",
            }}
          >
            <div className="absolute inset-y-0 left-0 bg-black" style={{ width: "45%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
