export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" className="bm-bg" />
      <rect x="7" y="14" width="4.5" height="11" rx="1" className="bm-bar" />
      <rect x="13.75" y="7" width="4.5" height="18" rx="1" className="bm-bar" />
      <rect x="20.5" y="11" width="4.5" height="14" rx="1" className="bm-bar" />
    </svg>
  )
}
