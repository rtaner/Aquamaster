"use client";

import { useEffect, useRef, useState } from "react";

interface LiquidLevelCountdownProps {
  /** Toplam dozajlama süresi (saniye) */
  totalSeconds: number;
  /** Kalan saniye süresi (senkronizasyon için isteğe bağlı) */
  remainingSeconds?: number;
  /** Dozajlama başladığında true, bitince false yapılmalı */
  isRunning: boolean;
  /** Su/sıvı rengi (örn. kanal rengiyle eşleşsin: "#378ADD") */
  color?: string;
  /** Dairenin piksel boyutu */
  size?: number;
  /** Süre bittiğinde tetiklenir */
  onComplete?: () => void;
}

export default function LiquidLevelCountdown({
  totalSeconds,
  remainingSeconds,
  isRunning,
  color = "#06b6d4",
  size = 160,
  onComplete,
}: LiquidLevelCountdownProps) {
  const [remaining, setRemaining] = useState(remainingSeconds ?? totalSeconds);
  const wave1Ref = useRef<SVGPathElement>(null);
  const wave2Ref = useRef<SVGPathElement>(null);

  // 5 Adet İnce Su Kabarcığı Ref'i
  const bubble1Ref = useRef<SVGCircleElement>(null);
  const bubble2Ref = useRef<SVGCircleElement>(null);
  const bubble3Ref = useRef<SVGCircleElement>(null);
  const bubble4Ref = useRef<SVGCircleElement>(null);
  const bubble5Ref = useRef<SVGCircleElement>(null);

  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef(0);
  const completedRef = useRef(false);

  const V = 220; // sabit viewBox birimi

  // Baloncukların görünürlüğü artırıldı (Opaklık %85)
  const bubblesData = [
    { ref: bubble1Ref, baseRatio: 0.38, radius: 2.2, speed: 0.25, phase: 0 },
    { ref: bubble2Ref, baseRatio: 0.62, radius: 2.6, speed: 0.18, phase: 3.5 },
  ];

  const wavePath = (levelY: number, amp: number, offset: number, horizOffset: number, tilt: number) => {
    const points: string[] = [];
    const centerX = V / 2;
    for (let x = -20; x <= V + 20; x += 10) {
      // Çalkalanma eğimi (Sağ taraf yükselirken sol taraf inen terazi hareketi)
      const tiltOffset = ((x - centerX) / centerX) * tilt;
      const y = levelY + tiltOffset + Math.sin((x + horizOffset) / 28 + offset) * amp;
      points.push(`${(x + horizOffset).toFixed(1)},${y.toFixed(1)}`);
    }
    return `M -20,${V} L -20,${levelY.toFixed(1)} L ${points.join(" L ")} L ${
      V + 20
    },${V} Z`;
  };

  const render = (level: number) => {
    const levelY = V - level * (V - 10);
    // Sağa - Sola Hafif Sıvı Salınımı (Gentle Horizontal Sway)
    const horizSway = Math.sin(phaseRef.current * 0.5) * 6;
    // Sıvı Çalkalanma Eğim Açısı (Right side up, left side down tilt)
    const tilt = Math.sin(phaseRef.current * 0.6) * 5.5;

    wave1Ref.current?.setAttribute("d", wavePath(levelY - 2, 4.5, phaseRef.current, horizSway, tilt));
    wave2Ref.current?.setAttribute("d", wavePath(levelY + 2, 3.2, phaseRef.current + 1.4, -horizSway, -tilt));

    // Net ve Belirgin Yükselen İnce Baloncuklar (%85 Opaklık)
    bubblesData.forEach((b, idx) => {
      if (!b.ref.current) return;
      const cycle = ((phaseRef.current * b.speed + b.phase) % 10) / 10;
      const bottomY = V - 15;
      const currentY = bottomY - cycle * (bottomY - levelY + 5);
      const currentX = V * b.baseRatio + Math.sin(phaseRef.current * 1.2 + idx) * 3;

      const isInsideLiquid = currentY >= levelY - 2;
      const opacity = isInsideLiquid ? 0.85 : 0;

      b.ref.current.setAttribute("cx", currentX.toFixed(1));
      b.ref.current.setAttribute("cy", currentY.toFixed(1));
      b.ref.current.setAttribute("r", b.radius.toString());
      b.ref.current.setAttribute("opacity", opacity.toString());
    });
  };

  useEffect(() => {
    if (remainingSeconds !== undefined) {
      setRemaining(remainingSeconds);
    }
  }, [remainingSeconds]);

  useEffect(() => {
    if (!isRunning) {
      startRef.current = null;
      completedRef.current = false;
      setRemaining(totalSeconds);
      render(1);
      return;
    }

    startRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - (startRef.current ?? now)) / 1000;
      const left = Math.max(0, totalSeconds - elapsed);
      phaseRef.current += 0.05;
      render(left / totalSeconds);
      if (remainingSeconds === undefined) {
        setRemaining(Math.ceil(left));
      }

      if (left <= 0) {
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete?.();
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isRunning, totalSeconds]);

  // Geri sayımla orantılı dinamik incelen çerçeve ve sönen parlaklık (Thinning border & glow)
  const currentLeft = remainingSeconds ?? remaining;
  const progressRatio = Math.max(0, Math.min(1, currentLeft / totalSeconds));
  const dynamicBorderWidth = 0.2 + 1.3 * progressRatio; // 1.5px -> 0.2px'e incelir
  const dynamicGlowBlur = Math.round(20 * progressRatio); // 20px -> 0px'e söner
  const borderAlpha = Math.round(15 + 65 * progressRatio).toString(16).padStart(2, "0");

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        background: "rgba(15, 23, 42, 0.95)",
        boxShadow: `0 0 ${dynamicGlowBlur}px ${color}${borderAlpha}`,
        border: `${dynamicBorderWidth.toFixed(1)}px solid ${color}${borderAlpha}`,
        transition: "border-width 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
      }}
    >
      <svg viewBox={`0 0 ${V} ${V}`} style={{ width: "100%", height: "100%" }}>
        <defs>
          <clipPath id="llc-clip">
            <circle cx={V / 2} cy={V / 2} r={V / 2} />
          </clipPath>
        </defs>
        <g clipPath="url(#llc-clip)">
          {/* Çift Sinüs Dalgalı Sıvı Yüzeyi */}
          <path ref={wave1Ref} fill={color} opacity={0.45} />
          <path ref={wave2Ref} fill={color} opacity={0.80} />

          {/* Yukarı Doğru Salınarak Çıkan İnce Baloncuklar */}
          <circle ref={bubble1Ref} fill="#ffffff" />
          <circle ref={bubble2Ref} fill="#e0f2fe" />
          <circle ref={bubble3Ref} fill="#ffffff" />
          <circle ref={bubble4Ref} fill="#bae6fd" />
          <circle ref={bubble5Ref} fill="#ffffff" />
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          color: "#fff",
          textShadow: "0 2px 5px rgba(0,0,0,0.9)",
        }}
      >
        <span className="font-mono font-black tracking-tight" style={{ fontSize: size * 0.25 }}>
          {remaining}
        </span>
        <span className="font-mono text-cyan-200 font-bold tracking-wider" style={{ fontSize: size * 0.08 }}>
          saniye
        </span>
      </div>
    </div>
  );
}
