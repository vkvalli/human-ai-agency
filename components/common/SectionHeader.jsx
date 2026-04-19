export default function SectionHeader({ title, description }) {
  return (
    <div className="mb-5">
      <h3 className="text-lg font-semibold tracking-tight text-cyan-800">
        {title}
      </h3>
      {description ? (
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      ) : null}
    </div>
  );
}
