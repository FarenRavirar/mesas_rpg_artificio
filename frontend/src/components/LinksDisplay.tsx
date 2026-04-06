import { Video, Music, Radio, MessageCircle, FileText, Globe, ExternalLink } from 'lucide-react';
import type { UserLink } from '../hooks/useLinks';
import './LinksDisplay.css';

const LINK_TYPE_ICONS = {
  youtube: Video,
  spotify: Music,
  twitch: Radio,
  twitter: MessageCircle,
  article: FileText,
  website: Globe,
};

const LINK_TYPE_LABELS = {
  youtube: 'YouTube',
  spotify: 'Spotify',
  twitch: 'Twitch',
  twitter: 'Twitter/X',
  article: 'Artigo',
  website: 'Website',
};

interface LinksDisplayProps {
  links: UserLink[];
}

export function LinksDisplay({ links }: LinksDisplayProps) {
  if (links.length === 0) return null;

  return (
    <section className="links-display">
      <h2>🎙️ Conteúdo & Redes</h2>
      
      <div className="links-display-grid">
        {links.map((link) => (
          <LinkCard key={link.id} link={link} />
        ))}
      </div>
    </section>
  );
}

interface LinkCardProps {
  link: UserLink;
}

function LinkCard({ link }: LinkCardProps) {
  const Icon = LINK_TYPE_ICONS[link.type];
  const label = LINK_TYPE_LABELS[link.type];
  const hasEmbed = link.embed_url && (link.type === 'youtube' || link.type === 'spotify');

  return (
    <div className="link-card">
      <div className="link-card-header">
        <div className="link-card-icon">
          <Icon className="w-5 h-5" />
        </div>
        <span className="link-card-type">{label}</span>
      </div>

      {hasEmbed ? (
        <div className="link-card-embed">
          {link.type === 'youtube' && (
            <iframe
              src={link.embed_url}
              title={link.title || 'YouTube video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
          
          {link.type === 'spotify' && (
            <iframe
              src={link.embed_url}
              title={link.title || 'Spotify embed'}
              allow="encrypted-media"
            />
          )}
        </div>
      ) : (
        <>
          {link.thumbnail_url && (
            <div className="link-card-thumbnail">
              <img src={link.thumbnail_url} alt={link.title || ''} />
            </div>
          )}
        </>
      )}

      <div className="link-card-content">
        <h3 className="link-card-title">
          {link.title || new URL(link.url).hostname}
        </h3>
        
        {link.description && (
          <p className="link-card-description">{link.description}</p>
        )}
        
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="link-card-cta"
        >
          Ver conteúdo
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
