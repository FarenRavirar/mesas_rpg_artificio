import { Router, Request, Response } from 'express';
import { db } from '../db';
import type { SystemNodeType } from '../db/types';

const router = Router();

interface SystemRecord {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  node_type: SystemNodeType;
  depth: number;
  path_slug: string | null;
}

interface SystemTreeNode extends SystemRecord {
  aliases: string[];
  has_children: boolean;
  children: SystemTreeNode[];
}

const normalizeText = (value: string): string => value.trim().toLowerCase();

const buildTree = (nodes: SystemTreeNode[]): SystemTreeNode[] => {
  const byId = new Map<string, SystemTreeNode>();
  const roots: SystemTreeNode[] = [];

  for (const node of nodes) {
    byId.set(node.id, node);
  }

  for (const node of nodes) {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)?.children.push(node);
      continue;
    }

    roots.push(node);
  }

  const sortNodes = (list: SystemTreeNode[]) => {
    list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    for (const node of list) {
      sortNodes(node.children);
    }
  };

  sortNodes(roots);
  return roots;
};

const filterTreeBySearch = (nodes: SystemTreeNode[], search: string): SystemTreeNode[] => {
  const normalizedSearch = normalizeText(search);

  const visit = (node: SystemTreeNode): SystemTreeNode | null => {
    const filteredChildren = node.children
      .map(visit)
      .filter((child): child is SystemTreeNode => Boolean(child));

    const matchesSelf =
      normalizeText(node.name).includes(normalizedSearch)
      || normalizeText(node.slug).includes(normalizedSearch)
      || normalizeText(node.path_slug ?? '').includes(normalizedSearch)
      || node.aliases.some((alias) => normalizeText(alias).includes(normalizedSearch));

    if (!matchesSelf && filteredChildren.length === 0) {
      return null;
    }

    return {
      ...node,
      children: filteredChildren,
      has_children: filteredChildren.length > 0,
    };
  };

  return nodes
    .map(visit)
    .filter((node): node is SystemTreeNode => Boolean(node));
};

// GET /api/v1/systems — Catálogo público de sistemas (flat + tree + aliases)
router.get('/', async (req: Request, res: Response) => {
  const view = typeof req.query.view === 'string' ? req.query.view.toLowerCase() : 'flat';
  const search = typeof req.query.search === 'string'
    ? req.query.search
    : typeof req.query.q === 'string'
      ? req.query.q
      : '';

  try {
    const [systems, aliases] = await Promise.all([
      db
        .selectFrom('systems')
        .select(['id', 'name', 'slug', 'parent_id', 'node_type', 'depth', 'path_slug'])
        .orderBy('depth', 'asc')
        .orderBy('name', 'asc')
        .execute() as Promise<SystemRecord[]>,
      db
        .selectFrom('system_aliases')
        .select(['system_id', 'alias'])
        .execute(),
    ]);

    const aliasesBySystem = new Map<string, string[]>();
    for (const row of aliases) {
      const current = aliasesBySystem.get(row.system_id) ?? [];
      aliasesBySystem.set(row.system_id, [...current, row.alias]);
    }

    const parentIds = new Set<string>();
    for (const system of systems) {
      if (system.parent_id) parentIds.add(system.parent_id);
    }

    const normalizedNodes: SystemTreeNode[] = systems.map((system) => ({
      ...system,
      aliases: aliasesBySystem.get(system.id) ?? [],
      has_children: parentIds.has(system.id),
      children: [],
    }));

    if (view === 'tree') {
      const fullTree = buildTree(normalizedNodes);
      const filteredTree = search.trim().length > 0
        ? filterTreeBySearch(fullTree, search)
        : fullTree;

      return res.json({ data: filteredTree });
    }

    const normalizedSearch = normalizeText(search);
    const filteredFlat = normalizedSearch
      ? normalizedNodes.filter((node) => {
        return normalizeText(node.name).includes(normalizedSearch)
          || normalizeText(node.slug).includes(normalizedSearch)
          || normalizeText(node.path_slug ?? '').includes(normalizedSearch)
          || node.aliases.some((alias) => normalizeText(alias).includes(normalizedSearch));
      })
      : normalizedNodes;

    return res.json({ data: filteredFlat });
  } catch (error: any) {
    console.error('[GET /systems]', error);
    return res.status(500).json({ error: 'Erro ao buscar sistemas.' });
  }
});

export default router;
