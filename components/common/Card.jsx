export default function Card({ children, className = "" }) {
    return (
      <div
        className={`rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_12px_35px_rgba(15,23,42,0.08)] backdrop-blur-sm ${className}`}
      >
        {children}
      </div>
    );
  }