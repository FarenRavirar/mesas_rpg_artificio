export interface System {
  id: string;
  name: string;
  name_pt?: string | null;
  slug: string;
  node_type: 'system' | 'edition' | 'variant' | 'subsystem';
  parent_id: string | null;
  depth?: number;
  path_slug: string | null;
  aliases?: string[];
  has_children?: boolean;
}

export interface PaginationInfo {
  next_cursor: string | null;
  has_more: boolean;
}

export interface SystemsResponse {
  data: System[];
  pagination: PaginationInfo;
}
