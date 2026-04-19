const sideBubbles = [
  { left: "1.2%", top: "8%", size: "2.2rem", delay: "-2s", duration: "24s", drift: "12px", end: "-18px" },
  { left: "2.4%", top: "24%", size: "1.6rem", delay: "-8s", duration: "20s", drift: "8px", end: "-12px" },
  { left: "3.8%", top: "44%", size: "2rem", delay: "-12s", duration: "26s", drift: "16px", end: "-16px" },
  { left: "2.2%", top: "64%", size: "2.4rem", delay: "-5s", duration: "28s", drift: "10px", end: "-14px" },
  { left: "4.8%", top: "17%", size: "1.1rem", delay: "-16s", duration: "18s", drift: "6px", end: "-10px" },
  { left: "5.2%", top: "54%", size: "1.4rem", delay: "-9s", duration: "22s", drift: "14px", end: "-8px" },
  { left: "4.1%", top: "78%", size: "1.8rem", delay: "-13s", duration: "25s", drift: "10px", end: "-15px" },
  { left: "0.8%", top: "36%", size: "1.2rem", delay: "-6s", duration: "19s", drift: "9px", end: "-11px" },
  { right: "1.6%", top: "10%", size: "1.8rem", delay: "-4s", duration: "22s", drift: "10px", end: "-14px" },
  { right: "2.6%", top: "32%", size: "2.2rem", delay: "-10s", duration: "26s", drift: "14px", end: "-16px" },
  { right: "3.4%", top: "56%", size: "1.5rem", delay: "-7s", duration: "20s", drift: "8px", end: "-10px" },
  { right: "2%", top: "74%", size: "2.5rem", delay: "-14s", duration: "30s", drift: "12px", end: "-18px" },
  { right: "4.6%", top: "20%", size: "1.2rem", delay: "-17s", duration: "18s", drift: "7px", end: "-9px" },
  { right: "5.1%", top: "47%", size: "1.7rem", delay: "-11s", duration: "24s", drift: "15px", end: "-12px" },
  { right: "4.2%", top: "82%", size: "1.3rem", delay: "-19s", duration: "21s", drift: "9px", end: "-13px" },
  { right: "0.9%", top: "63%", size: "1rem", delay: "-6s", duration: "17s", drift: "8px", end: "-10px" },
];

const centerBubbles = [
  { left: "18%", top: "28%", size: "0.7rem", delay: "-3s", duration: "18s", drift: "10px", end: "-12px" },
  { left: "24%", top: "58%", size: "0.9rem", delay: "-9s", duration: "20s", drift: "8px", end: "-10px" },
  { left: "31%", top: "24%", size: "0.6rem", delay: "-5s", duration: "16s", drift: "12px", end: "-8px" },
  { left: "42%", top: "34%", size: "0.8rem", delay: "-11s", duration: "19s", drift: "9px", end: "-11px" },
  { left: "48%", top: "84%", size: "0.7rem", delay: "-13s", duration: "19s", drift: "10px", end: "-12px" },
  { left: "57%", top: "79%", size: "1.1rem", delay: "-6s", duration: "24s", drift: "14px", end: "-14px" },
  { left: "63%", top: "38%", size: "0.7rem", delay: "-10s", duration: "18s", drift: "11px", end: "-9px" },
  { left: "67%", top: "16%", size: "0.8rem", delay: "-9s", duration: "20s", drift: "12px", end: "-10px" },
  { left: "77%", top: "54%", size: "0.9rem", delay: "-11s", duration: "22s", drift: "9px", end: "-12px" },
  { left: "84%", top: "30%", size: "0.75rem", delay: "-7s", duration: "18s", drift: "10px", end: "-10px" },
];

export default function OceanBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
    >
      <div className="absolute inset-0 ocean-scene-image" />
      <div className="absolute inset-0 ocean-scene-image-secondary" />
      <div className="absolute inset-0 ocean-scene-overlay" />
      <div className="absolute inset-x-0 top-0 h-[22rem] ocean-scene-surface-glow" />
      <div className="absolute inset-x-0 top-0 h-[24rem] ocean-scene-surface-shimmer" />

      {sideBubbles.map((bubble, index) => (
        <span
          key={`side-bubble-${index}`}
          className="absolute ocean-side-bubble"
          style={{
            left: bubble.left,
            right: bubble.right,
            top: bubble.top,
            width: bubble.size,
            height: bubble.size,
            "--bubble-mid-x": bubble.drift,
            "--bubble-end-x": bubble.end,
            animationDelay: bubble.delay,
            animationDuration: bubble.duration,
          }}
        />
      ))}

      {centerBubbles.map((bubble, index) => (
        <span
          key={`center-bubble-${index}`}
          className="absolute ocean-center-bubble"
          style={{
            left: bubble.left,
            top: bubble.top,
            width: bubble.size,
            height: bubble.size,
            "--bubble-mid-x": bubble.drift,
            "--bubble-end-x": bubble.end,
            animationDelay: bubble.delay,
            animationDuration: bubble.duration,
          }}
        />
      ))}
    </div>
  );
}
