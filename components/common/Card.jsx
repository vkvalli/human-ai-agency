export default function Card({ children, className = "", ...props }) {
  return (
    <div
      {...props}
      className={`rounded-[2rem] border border-cyan-200 bg-white/80 shadow-[0_10px_30px_rgba(34,211,238,0.15)] backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}
