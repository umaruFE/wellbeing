import { ArrowLeft, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

// The previous song/music/yoga editors are intentionally not mounted in this redesign.
// The accepted versions belong to the integrated workbench and will be connected separately.
export function ModuleTransition({ title }) {
  return (
    <section className="max-w-3xl mx-auto p-7 max-sm:p-4">
      <Link to="/" className="inline-flex items-center gap-2 text-[var(--wb-muted)] mb-8 hover:text-[var(--wb-primary)]"><ArrowLeft size={16} />返回工作看板</Link>
      <div className="bg-white border border-[var(--wb-border-soft)] rounded-[14px] p-8">
        <BookOpen size={28} className="text-[var(--wb-primary)] mb-5" />
        <h1 className="text-[28px] font-bold text-[var(--wb-text)]">{title}</h1>
        <p className="text-[var(--wb-muted)] mt-3">此模块将使用当前小星星工作台版本，整合后在这里开放。</p>
      </div>
    </section>
  );
}
