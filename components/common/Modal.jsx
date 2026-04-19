export default function Modal({ open, title, children, onClose }) {
    if (!open) return null;
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
        <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
            </div>
  
            <button
              onClick={onClose}
              className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-200"
            >
              Close
            </button>
          </div>
  
          <div className="mt-5">{children}</div>
        </div>
      </div>
    );
  }