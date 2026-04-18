import { Router, Request, Response } from 'express';
import { db } from '../db';
import { sql } from 'kysely';
import type { SystemNodeType } from '../db/types';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

interface SystemRecord {
  id: string;
  name: string;
  name_pt: string | null;
  slug: string;
  parent_id: string | null;
  node_type: SystemNodeType;
  depth: number;
  path_slug: string | null;
  children_count: number;
  tables_count: number;
  aliases_count: number;
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
// Suporta paginação cursor-based: ?limit=50&cursor=abc123
router.get('/', async (req: Request, res: Response) => {
  const view = typeof req.query.view === 'string' ? req.query.view.toLowerCase() : 'flat';
  const search = typeof req.query.search === 'string'
    ? req.query.search
    : typeof req.query.q === 'string'
      ? req.query.q
      : '';
  
  // Paginação cursor-based
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;

  try {
    // REGRA: view=tree NUNCA pagina (precisa da árvore completa)
    if (view === 'tree' && (limit || cursor)) {
      console.warn('[GET /systems] view=tree ignora paginação (limit/cursor)');
    }

    const shouldPaginate = view !== 'tree' && limit !== undefined && limit > 0;

    // Query base de systems com contadores agregados
    let systemsQuery = db
      .selectFrom('systems as s')
      .leftJoin('systems as children', 'children.parent_id', 's.id')
      .leftJoin('tables', 'tables.system_id', 's.id')
      .leftJoin('system_aliases as al', 'al.system_id', 's.id')
      .select([
        's.id', 's.name', 's.name_pt', 's.slug', 
        's.parent_id', 's.node_type', 's.depth', 's.path_slug',
        sql<number>`COUNT(DISTINCT children.id)`.as('children_count'),
        sql<number>`COUNT(DISTINCT tables.id)`.as('tables_count'),
        sql<number>`COUNT(DISTINCT al.id)`.as('aliases_count'),
      ])
      .groupBy(['s.id'])
      .orderBy('s.depth', 'asc')
      .orderBy('s.name', 'asc');

    // Aplicar cursor (continuar de onde parou)
    if (shouldPaginate && cursor) {
      systemsQuery = systemsQuery.where('s.id', '>', cursor);
    }

    // Aplicar limit (+1 para detectar has_more)
    if (shouldPaginate) {
      systemsQuery = systemsQuery.limit(limit + 1);
    }

    const [systems, aliases] = await Promise.all([
      systemsQuery.execute() as Promise<SystemRecord[]>,
      db
        .selectFrom('system_aliases')
        .select(['system_id', 'alias'])
        .execute(),
    ]);

    // Detectar se há mais páginas
    let hasMore = false;
    let nextCursor: string | null = null;
    
    if (shouldPaginate && systems.length > limit) {
      hasMore = true;
      systems.pop(); // Remove o item extra
      nextCursor = systems[systems.length - 1]?.id || null;
    }

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

      // view=tree sempre retorna tudo (sem paginação)
      return res.json({ 
        data: filteredTree,
        pagination: {
          next_cursor: null,
          has_more: false,
        },
      });
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

    // Envelope de resposta com paginação
    return res.json({ 
      data: filteredFlat,
      pagination: {
        next_cursor: shouldPaginate ? nextCursor : null,
        has_more: shouldPaginate ? hasMore : false,
      },
    });
  } catch (error: any) {
    console.error('[GET /systems]', error);
    return res.status(500).json({ error: 'Erro ao buscar sistemas.' });
  }
});

// =============================================================================
// ROTAS ADMINISTRATIVAS (CRUD)
// =============================================================================

// Função auxiliar para gerar slug
const slugify = (value: string): string => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

// POST /api/v1/admin/systems — Criar novo sistema
router.post('/admin', authMiddleware, requireRole('admin'), async (req: Request, res: Response) => {
  const { name, name_pt, node_type, parent_id, aliases } = req.body;

  if (!name || !node_type) {
    return res.status(400).json({ error: 'Nome e tipo são obrigatórios.' });
  }

  if (!['system', 'edition', 'variant'].includes(node_type)) {
    return res.status(400).json({ error: 'Tipo inválido. Use: system, edition ou variant.' });
  }

  if ((node_type === 'edition' || node_type === 'variant') && !parent_id) {
    return res.status(400).json({ error: 'Edições e variantes precisam de um sistema pai.' });
  }

  try {
    const slug = slugify(name);

    // Verificar se slug já existe
    const existing = await db
      .selectFrom('systems')
      .select('id')
      .where('slug', '=', slug)
      .executeTakeFirst();

    if (existing) {
      return res.status(409).json({ error: 'Já existe um sistema com este slug.' });
    }

    // Calcular depth e path_slug
    let depth = 0;
    let path_slug = slug;

    if (parent_id) {
      const parent = await db
        .selectFrom('systems')
        .select(['depth', 'path_slug'])
        .where('id', '=', parent_id)
        .executeTakeFirst();

      if (!parent) {
        return res.status(404).json({ error: 'Sistema pai não encontrado.' });
      }

      depth = parent.depth + 1;
      path_slug = `${parent.path_slug}/${slug}`;
    }

    // Inserir sistema
    const newSystem = await db
      .insertInto('systems')
      .values({
        name,
        name_pt: name_pt || null,
        slug,
        node_type: node_type as SystemNodeType,
        parent_id: parent_id || null,
        depth,
        path_slug,
      })
      .returning(['id', 'name', 'name_pt', 'slug', 'node_type', 'parent_id', 'depth', 'path_slug'])
      .executeTakeFirst();

    // Inserir aliases se fornecidos
    if (aliases && Array.isArray(aliases) && aliases.length > 0) {
      for (const alias of aliases) {
        if (alias && alias.trim()) {
          await db
            .insertInto('system_aliases')
            .values({
              system_id: newSystem!.id,
              alias: alias.trim(),
              alias_slug: slugify(alias),
              is_official: false,
            })
            .onConflict((oc) => oc.columns(['system_id', 'alias_slug']).doNothing())
            .execute();
        }
      }
    }

    return res.status(201).json({ data: newSystem });
  } catch (error: any) {
    console.error('[POST /admin/systems]', error);
    return res.status(500).json({ error: 'Erro ao criar sistema.' });
  }
});

// PUT /api/v1/admin/systems/:id — Editar sistema
router.put('/admin/:id', authMiddleware, requireRole('admin'), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, name_pt, node_type, parent_id } = req.body;

  if (!name || !node_type) {
    return res.status(400).json({ error: 'Nome e tipo são obrigatórios.' });
  }

  try {
    // Verificar se sistema existe
    const existing = await db
      .selectFrom('systems')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!existing) {
      return res.status(404).json({ error: 'Sistema não encontrado.' });
    }

    const slug = slugify(name);

    // Verificar se slug já existe em outro sistema
    const duplicateSlug = await db
      .selectFrom('systems')
      .select('id')
      .where('slug', '=', slug)
      .where('id', '!=', id)
      .executeTakeFirst();

    if (duplicateSlug) {
      return res.status(409).json({ error: 'Já existe outro sistema com este slug.' });
    }

    // Calcular depth e path_slug
    let depth = 0;
    let path_slug = slug;

    if (parent_id) {
      const parent = await db
        .selectFrom('systems')
        .select(['depth', 'path_slug'])
        .where('id', '=', parent_id)
        .executeTakeFirst();

      if (!parent) {
        return res.status(404).json({ error: 'Sistema pai não encontrado.' });
      }

      depth = parent.depth + 1;
      path_slug = `${parent.path_slug}/${slug}`;
    }

    // Atualizar sistema
    const updated = await db
      .updateTable('systems')
      .set({
        name,
        name_pt: name_pt || null,
        slug,
        node_type: node_type as SystemNodeType,
        parent_id: parent_id || null,
        depth,
        path_slug,
      })
      .where('id', '=', id)
      .returning(['id', 'name', 'name_pt', 'slug', 'node_type', 'parent_id', 'depth', 'path_slug'])
      .executeTakeFirst();

    // Atualizar aliases se fornecidos
    const { aliases } = req.body;
    if (aliases && Array.isArray(aliases)) {
      // Deletar aliases existentes
      await db
        .deleteFrom('system_aliases')
        .where('system_id', '=', id)
        .execute();

      // Inserir novos aliases
      for (const alias of aliases) {
        if (alias && alias.trim()) {
          await db
            .insertInto('system_aliases')
            .values({
              system_id: id,
              alias: alias.trim(),
              alias_slug: slugify(alias),
              is_official: false,
            })
            .onConflict((oc) => oc.columns(['system_id', 'alias_slug']).doNothing())
            .execute();
        }
      }
    }

    // TODO: Recalcular hierarquia de filhos se parent_id mudou

    return res.json({ data: updated });
  } catch (error: any) {
    console.error('[PUT /admin/systems/:id]', error);
    return res.status(500).json({ error: 'Erro ao atualizar sistema.' });
  }
});

// DELETE /api/v1/admin/systems/:id — Deletar sistema
router.delete('/admin/:id', authMiddleware, requireRole('admin'), async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Verificar se sistema existe
    const existing = await db
      .selectFrom('systems')
      .select('name')
      .where('id', '=', id)
      .executeTakeFirst();

    if (!existing) {
      return res.status(404).json({ error: 'Sistema não encontrado.' });
    }

    // Verificar se há mesas vinculadas
    const tablesCount = await db
      .selectFrom('tables')
      .select(db.fn.count('id').as('count'))
      .where('system_id', '=', id)
      .executeTakeFirst();

    if (tablesCount && Number(tablesCount.count) > 0) {
      return res.status(409).json({
        error: `Não é possível deletar este sistema. Existem ${tablesCount.count} mesa(s) vinculada(s).`,
      });
    }

    // Verificar se há sistemas filhos
    const childrenCount = await db
      .selectFrom('systems')
      .select(db.fn.count('id').as('count'))
      .where('parent_id', '=', id)
      .executeTakeFirst();

    if (childrenCount && Number(childrenCount.count) > 0) {
      return res.status(409).json({
        error: `Não é possível deletar este sistema. Existem ${childrenCount.count} sistema(s) filho(s).`,
      });
    }

    // Deletar aliases primeiro
    await db
      .deleteFrom('system_aliases')
      .where('system_id', '=', id)
      .execute();

    // Deletar sistema
    await db
      .deleteFrom('systems')
      .where('id', '=', id)
      .execute();

    return res.json({ data: { message: 'Sistema deletado com sucesso.' } });
  } catch (error: any) {
    console.error('[DELETE /admin/systems/:id]', error);
    return res.status(500).json({ error: 'Erro ao deletar sistema.' });
  }
});

export default router;
