export default function Card({ children, className = "" }) {
    return (
      <div className="rounded-[2rem] bg-white/80 border border-cyan-200 shadow-[0_10px_30px_rgba(34,211,238,0.15)] backdrop-blur-sm">
        {children}
      </div>
    );
  }