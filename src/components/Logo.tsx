const LOGO_IMAGE_SRC = "/images/logo.png";

export function Logo({ size = 40, showText = true }: { size?: number; showText?: boolean }) {
  return (
    <div className="flex items-center gap-3 shrink-0">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <img src={LOGO_IMAGE_SRC} alt="Estandarte Dental Clinic logo" width={size} height={size} className="w-full h-full object-contain" />
      </div>
      {showText && (
        <div className="leading-none shrink-0">
          <div className="font-bold text-xl text-yellow-300 tracking-tight">Estandarte</div>
          <div className="text-xs uppercase tracking-widest text-amber-300 font-semibold mt-1">Dental Clinic</div>
        </div>
      )}
    </div>
  );
}

export function LogoMark({ size = 48 }: { size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <img src={LOGO_IMAGE_SRC} alt="Estandarte Dental Clinic mark" width={size} height={size} className="w-full h-full object-contain" />
    </div>
  );
}
