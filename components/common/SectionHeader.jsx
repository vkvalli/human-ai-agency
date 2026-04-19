export default function SectionHeader({ title, description }) {
    return (
      <div className="mb-4">
       <h3 className="text-lg font-semibold text-cyan-800">{title}</h3>
<p className="mt-1 text-sm text-slate-500">{description}</p>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
          
        )}
      </div>
    );
  }