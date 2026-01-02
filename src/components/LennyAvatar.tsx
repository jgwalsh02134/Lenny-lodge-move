type LennyAvatarProps = {
  size?: number;
  mood?: "normal" | "serious";
  alt?: string;
};

export function LennyAvatar({
  size = 44,
  mood = "normal",
  alt = "Lenny Lodge",
}: LennyAvatarProps) {
  const borderColor = mood === "serious" ? "rgba(235, 87, 87, 0.55)" : "rgba(0, 0, 0, 0.12)";

  return (
    <img
      src="/lenny/lenny-idle.png"
      alt={alt}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        border: `1px solid ${borderColor}`,
        background: "rgba(255,255,255,0.6)",
        objectFit: "cover",
        display: "block",
      }}
    />
  );
}


