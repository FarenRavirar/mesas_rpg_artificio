export interface System {
  id: string;
  name: string;
  name_pt?: string | null;
  slug: string;
  node_type: 'system' | 'edition' | 'variant';
  parent_id: string | null;
  aliases?: string[];
}
