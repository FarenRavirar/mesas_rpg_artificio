import { Link } from 'react-router-dom';
import { CheckCircle2, Star, Dice1, Globe, MapPin } from 'lucide-react';
import type { TableCard } from '../../types/tables';
import { SlotsIndicator } from '../SlotsIndicator';
import { getSlotsVisualState } from '../../utils/slots';
import bannerPlaceholder from '../../assets/banner_placeholder.webp';

interface Props {
  table: TableCard;
}

const modalityLabels: Record<string, string> = {
  online: 'Online',
  presencial: 'Presencial',
  hibrida: 'Híbrida',
};

export function MestreFeaturedTable({ table }: Props) {
  const { isFull } = getSlotsVisualState(table);
  const features: string[] = Array.isArray((table as any).features)
    ? ((table as any).features as string[])
    : [];

  return (
    <article className="mestre-featured-table">
      <Link
        to={`/mesas/${table.slug}`}
        className="mestre-featured-table-link"
        id={`featured-table-${table.slug}`}
      >
        <div className="mestre-featured-table-cover">
          <img
            src={table.cover_url || bannerPlaceholder}
            alt={table.title}
            onError={(event) => {
              const img = event.currentTarget;
              if (img.dataset.fallbackApplied === 'true') return;
              img.dataset.fallbackApplied = 'true';
              img.src = bannerPlaceholder;
            }}
          />
          <span className="mestre-featured-table-badge">
            <Star className="w-4 h-4" /> Mesa em destaque
          </span>
        </div>

        <div className="mestre-featured-table-content">
          <div className="mestre-featured-table-tags">
            {table.system_name && (
              <span className="mestre-featured-table-tag">
                <Dice1 className="w-3 h-3" /> {table.system_name}
              </span>
            )}
            <span className="mestre-featured-table-tag">
              {table.modality === 'online' ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
              {modalityLabels[table.modality] ?? table.modality}
            </span>
          </div>

          <h3 className="mestre-featured-table-title">{table.title}</h3>

          {table.description && (
            <p className="mestre-featured-table-description">{table.description}</p>
          )}

          {features.length > 0 && (
            <ul className="mestre-featured-table-features">
              {features.slice(0, 5).map((feat, i) => (
                <li key={i}>
                  <CheckCircle2 className="w-4 h-4" /> {feat}
                </li>
              ))}
            </ul>
          )}

          <div className="mestre-featured-table-footer">
            <SlotsIndicator table={table} />
            {table.price_type === 'gratuita' ? (
              <span className="mestre-featured-table-price mestre-featured-table-price--free">
                Gratuito
              </span>
            ) : table.price_value ? (
              <span className="mestre-featured-table-price">
                R$ {table.price_value}
                <span className="mestre-featured-table-price-suffix"> / sessão</span>
              </span>
            ) : null}
          </div>

          <div className="mestre-featured-table-cta-wrapper">
            <span
              className={`cta-button cta-button-large${isFull ? ' cta-button-disabled' : ''}`}
            >
              {isFull ? 'Mesa lotada' : 'Quero jogar esta aventura →'}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
