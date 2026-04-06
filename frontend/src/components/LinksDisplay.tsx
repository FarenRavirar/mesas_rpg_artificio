import { Video, Music, Radio, MessageCircle, FileText, Globe, ExternalLink, Camera, Share2, Briefcase } from 'lucide-react';
import type { UserLink } from '../hooks/useLinks';
import './LinksDisplay.css';

const LINK_TYPE_ICONS = {
  youtube: Video,
  spotify: Music,
  twitch: Radio,
  twitter: MessageCircle,
  instagram: Camera, // Instagram usa Camera
  facebook: Share2, // Facebook usa Share2
  tiktok: Music, // TikTok usa Music
  linkedin: Briefcase, // LinkedIn usa Briefcase
  podcast: Radio,
  article: FileText,
  website: Globe,
};

const LINK_TYPE_LABELS = {
  youtube: 'YouTube',
  spotify: 'Spotify',
  twitch: 'Twitch',
  twitter: 'Twitter/X',
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  podcast: 'Podcast',
  article: 'Artigo',
  website: 'Website',
};

// Categorias para organização visual
const CATEGORIES = {
  content: ['youtube', 'twitch', 'podcast', 'spotify'],
  social: ['instagram', 'twitter', 'facebook', 'tiktok', 'linkedin'],
  authority: ['article', 'website'],
};

const CATEGORY_LABELS = {
  content: '🎥 Conteúdo',
  social: '🌐 Presença',
  authority: '🧠 Autoridade',
};

interface LinksDisplayProps {
  links: UserLink[];
}

export function LinksDisplay({ links }: LinksDisplayProps) {
  if (links.length === 0) return null;

  // Agrupar links por categoria
  const groupedLinks = {
    content: links.filter(l => CATEGORIES.content.includes(l.type)),
    social: links.filter(l => CATEGORIES.social.includes(l.type)),
    authority: links.filter(l => CATEGORIES.authority.includes(l.type)),
  };

  return (
    <section className="links-display">
      <h2>🎙️ Conteúdo & Redes</h2>
      
      {Object.entries(groupedLinks).map(([category, categoryLinks]) => {
        if (categoryLinks.length === 0) return null;
        
        return (
          <div key={category} className="links-category">
            <h3 className="category-title">{CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}</h3>
            <div className="links-display-grid">
              {categoryLinks.map((link) => (
                <LinkCard key={link.id} link={link} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

interface LinkCardProps {
  link: UserLink;
}

function LinkCard({ link }: LinkCardProps) {
  const Icon = LINK_TYPE_ICONS[link.type as keyof typeof LINK_TYPE_ICONS] || Globe;
  const label = LINK_TYPE_LABELS[link.type as keyof typeof LINK_TYPE_LABELS] || 'Link';
  
  // Apenas YouTube, Spotify e Twitch têm embed pesado
  const hasHeavyEmbed = ['youtube', 'spotify', 'twitch'].includes(link.type) && link.embed_url;
  
  // Redes sociais têm preview leve
  const isSocial = CATEGORIES.social.includes(link.type);

  return (
    <div className="link-card">
      <div className="link-card-header">
        <div className="link-card-icon">
          <Icon className="w-5 h-5" />
        </div>
        <span className="link-card-type">{label}</span>
      </div>

      {/* Embeds pesados (YouTube, Spotify, Twitch) */}
      {hasHeavyEmbed && (
        <div className="link-card-embed">
          <iframe
            src={link.embed_url}
            title={link.title || label}
            allow={link.type === 'youtube' ? "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" : "encrypted-media"}
            allowFullScreen={link.type === 'youtube' || link.type === 'twitch'}
          />
        </div>
      )}

      {/* Preview leve para redes sociais */}
      {isSocial && !hasHeavyEmbed && (
        <div className="link-card-social-preview">
          <Icon className="w-8 h-8" />
          <p className="social-username">{new URL(link.url).pathname.split('/')[1] || label}</p>
        </div>
      )}

      {/* Thumbnail para artigos/sites */}
      {!hasHeavyEmbed && !isSocial && link.thumbnail_url && (
        <div className="link-card-thumbnail">
          <img src={link.thumbnail_url} alt={link.title || ''} />
        </div>
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
