/**
 * Ruixen Moon / Bolt-style immersive background; light mode uses subtle blue tint.
 */
export function RayBackground() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
      <div className="absolute inset-0 bg-gray-50 dark:bg-[#0f0f0f]" />
      <div
        className="absolute left-1/2 -translate-x-1/2 w-[4000px] h-[1800px] sm:w-[6000px] dark:opacity-100 opacity-80"
        style={{
          background: `radial-gradient(circle at center 800px, rgba(20, 136, 252, 0.8) 0%, rgba(20, 136, 252, 0.35) 14%, rgba(20, 136, 252, 0.18) 18%, rgba(20, 136, 252, 0.08) 22%, rgba(17, 17, 20, 0.2) 25%)`,
        }}
      />
      <div
        className="absolute inset-0 dark:opacity-0 opacity-60 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(20, 136, 252, 0.12) 0%, transparent 50%)",
        }}
      />
    </div>
  );
}
