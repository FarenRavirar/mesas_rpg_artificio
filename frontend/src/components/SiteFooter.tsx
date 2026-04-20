import { Heart, ShieldCheck, Sparkles, Code2, Bug, Lightbulb } from 'lucide-react';

export const SiteFooter = () => {
  return (
    <footer className="mt-24 border-t border-white/10 bg-[#0e1a30] text-white/75">
      <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-[1.45fr_1fr_1fr] gap-y-12 md:gap-x-12 lg:gap-x-16">
          <section aria-labelledby="footer-brand-title" className="max-w-xl">
            <h2 id="footer-brand-title" className="text-xl font-semibold text-white tracking-[0.01em]">
              Artifício Mesas RPG
            </h2>
            <p className="mt-5 text-sm leading-7 text-white/70 max-w-md">
              Portal colaborativo para descobrir e publicar mesas de RPG com curadoria comunitária,
              sem anúncios e com foco total na experiência dos jogadores e mestres.
            </p>
          </section>

          <section aria-labelledby="footer-commitments-title" className="md:justify-self-start">
            <h2 id="footer-commitments-title" className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60 mb-5">
              Compromissos públicos
            </h2>
            <ul className="space-y-3.5 text-sm text-white/80">
              <li className="flex items-start gap-2.5 leading-relaxed" id="footer-commitment-free">
                <Heart className="w-4 h-4 mt-0.5 shrink-0 text-emerald-300" />
                100% gratuito para sempre
              </li>
              <li className="flex items-start gap-2.5 leading-relaxed" id="footer-commitment-no-ads">
                <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-amber-300" />
                Sem anúncios
              </li>
              <li className="flex items-start gap-2.5 leading-relaxed" id="footer-commitment-privacy">
                <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-sky-300" />
                Sem coleta desnecessária de dados
              </li>
            </ul>
          </section>

          <section aria-labelledby="footer-contribute-title" className="max-w-sm md:justify-self-start">
            <h2 id="footer-contribute-title" className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60 mb-5">
              Contribua
            </h2>
            <p className="text-sm leading-7 text-white/70 mb-5">
              Este é um projeto open source! Sua ajuda é bem-vinda.
            </p>
            <ul className="space-y-3.5 text-sm">
              <li>
                <a
                  href="https://github.com/FarenRavirar/mesas_rpg_artificio"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-start gap-2.5 leading-relaxed text-white/80 hover:text-white transition-colors"
                >
                  <Code2 className="w-4 h-4 mt-0.5 shrink-0" />
                  Ver no GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/FarenRavirar/mesas_rpg_artificio/issues/new"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-start gap-2.5 leading-relaxed text-white/80 hover:text-white transition-colors"
                >
                  <Bug className="w-4 h-4 mt-0.5 shrink-0" />
                  Reportar bug
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/FarenRavirar/mesas_rpg_artificio/issues/new"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-start gap-2.5 leading-relaxed text-white/80 hover:text-white transition-colors"
                >
                  <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" />
                  Sugerir melhoria
                </a>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto w-full max-w-7xl px-6 py-7 text-xs text-white/55 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Artifício RPG. Todos os direitos reservados.</span>
          <a
            id="footer-link-artificio"
            href="https://artificiorpg.com"
            target="_blank"
            rel="noreferrer"
            className="text-white/70 hover:text-white transition-colors"
          >
            artificiorpg.com
          </a>
        </div>
      </div>
    </footer>
  );
};
