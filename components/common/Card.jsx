export default function Card({ children, className = "", ...props }) {
  return (
    <div
      {...props}
      className={`rounded-[2rem] border border-sky-100/75 bg-white/88 shadow-[0_18px_42px_rgba(4,42,74,0.18)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}
