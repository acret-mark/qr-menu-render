import Image from "next/image";

// Deliberate QR-motif placeholder pattern when no logo is set — matches
// qr-menu-dev's own choice of a themed background over a generic gray box
// or avatar-initial fallback (research.md).
const HERO_PATTERN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='none'/%3E%3Cpath d='M0 0h20v20H0zM40 0h20v20H40zM0 40h20v20H0zM40 40h20v20H40z' fill='%23ffffff' fill-opacity='0.08'/%3E%3C/svg%3E";

export function MenuHeader({
  name,
  logoUrl,
  languageSelector,
}: {
  name: string;
  logoUrl: string | null;
  languageSelector?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <div
        className="relative flex h-40 items-center justify-center overflow-hidden bg-primary"
        style={!logoUrl ? { backgroundImage: `url("${HERO_PATTERN}")` } : undefined}
      >
        {logoUrl && (
          <>
            <Image src={logoUrl} alt="" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/20" />
          </>
        )}
        {languageSelector && <div className="absolute right-3 top-3">{languageSelector}</div>}
      </div>
      <div className="-mt-6 rounded-t-[28px] bg-card px-4 pb-2 pt-6">
        <h1 className="text-center text-xl font-semibold">{name}</h1>
      </div>
    </div>
  );
}
