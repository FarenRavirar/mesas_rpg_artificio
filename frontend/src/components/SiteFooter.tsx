import { Heart, ShieldCheck, Sparkles } from 'lucide-react';

export const SiteFooter = () => {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#0e1a30] text-white/75">
      <div className="container mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-8">
        <section aria-labelledby="footer-brand-title">
          <h2 id="footer-brand-title" className="text-lg font-bold text-white tracking-wide">
            Artifício Mesas RPG
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/65 max-w-2xl">
            Portal colaborativo para descobrir e publicar mesas de RPG com curadoria comunitária,
            sem anúncios e com foco total na experiência dos jogadores e mestres.
          </p>
        </section>

        <section aria-labelledby="footer-commitments-title">
          <h2 id="footer-commitments-title" className="text-sm uppercase tracking-[0.18em] text-white/50 mb-3">
            Compromissos públicos
          </h2>
          <ul className="space-y-2 text-sm">
            <li className="inline-flex items-center gap-2" id="footer-commitment-free">
              <Heart className="w-4 h-4 text-emerald-300" />
              100% gratuito para sempre
            </li>
            <li className="inline-flex items-center gap-2" id="footer-commitment-no-ads">
              <Sparkles className="w-4 h-4 text-amber-300" />
              Sem anúncios
            </li>
            <li className="inline-flex items-center gap-2" id="footer-commitment-privacy">
              <ShieldCheck className="w-4 h-4 text-sky-300" />
              Sem coleta desnecessária de dados
            </li>
          </ul>
        </section>
      </div>

      <div className="border-t border-white/10">
        <div className="container mx-auto px-6 py-4 text-xs text-white/50 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Artifício RPG. Todos os direitos reservados.</span>
          <a
            id="footer-link-artificio"
            href="https://artificiorpg.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors"
          >
            artificiorpg.com
          </a>
        </div>
      </div>
    </footer>
  );
};
