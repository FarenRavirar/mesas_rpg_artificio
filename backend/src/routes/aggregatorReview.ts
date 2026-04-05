import { Router, Request, Response } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { candidateService } from '../services/aggregator/candidateService';
import type { AggregatorEditorialStatus } from '../db/types';

const router = Router();

router.use(authMiddleware, requireRole('admin'));

const ALLOWED_EDITORIAL_STATUS: AggregatorEditorialStatus[] = ['accepted', 'rejected', 'awaiting_review'];

const asPositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.floor(parsed));
};

const parseEditorialStatus = (value: unknown): AggregatorEditorialStatus | undefined => {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim() as AggregatorEditorialStatus;
  if (ALLOWED_EDITORIAL_STATUS.includes(normalized)) {
    return normalized;
  }

  return undefined;
};

// GET /api/v1/aggregator/candidates
router.get('/candidates', async (req: Request, res: Response) => {
  const editorialStatus = parseEditorialStatus(req.query.editorial_status);

  if (req.query.editorial_status !== undefined && !editorialStatus) {
    return res.status(400).json({
      error: 'editorial_status inválido. Use accepted, rejected ou awaiting_review.',
    });
  }

  const page = asPositiveInt(req.query.page, 1);
  const limit = asPositiveInt(req.query.limit, 20);

  try {
    const result = await candidateService.list({
      editorialStatus,
      page,
      limit,
    });

    return res.json({ data: result.items, pagination: result.pagination });
  } catch (error: any) {
    console.error('[GET /aggregator/candidates]', error);
    return res.status(500).json({ error: 'Erro ao listar candidatos do agregador.' });
  }
});

// GET /api/v1/aggregator/candidates/:id
router.get('/candidates/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const candidate = await candidateService.getById(id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidato não encontrado.' });
    }

    return res.json({ data: candidate });
  } catch (error: any) {
    console.error('[GET /aggregator/candidates/:id]', error);
    return res.status(500).json({ error: 'Erro ao buscar candidato.' });
  }
});

// PATCH /api/v1/aggregator/candidates/:id/accept
router.patch('/candidates/:id/accept', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const updated = await candidateService.accept(id);
    if (!updated) {
      return res.status(404).json({ error: 'Candidato não encontrado.' });
    }

    return res.json({ data: updated });
  } catch (error: any) {
    console.error('[PATCH /aggregator/candidates/:id/accept]', error);
    return res.status(500).json({ error: 'Erro ao aceitar candidato.' });
  }
});

// PATCH /api/v1/aggregator/candidates/:id/reject
router.patch('/candidates/:id/reject', async (req: Request, res: Response) => {
  const { id } = req.params;
  const rejectionReason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';

  if (!rejectionReason) {
    return res.status(400).json({ error: 'Informe reason para rejeitar o candidato.' });
  }

  try {
    const updated = await candidateService.reject(id, rejectionReason);
    if (!updated) {
      return res.status(404).json({ error: 'Candidato não encontrado.' });
    }

    return res.json({ data: updated });
  } catch (error: any) {
    console.error('[PATCH /aggregator/candidates/:id/reject]', error);
    return res.status(500).json({ error: 'Erro ao rejeitar candidato.' });
  }
});

// PATCH /api/v1/aggregator/candidates/:id/review
router.patch('/candidates/:id/review', async (req: Request, res: Response) => {
  const { id } = req.params;
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : null;

  try {
    const updated = await candidateService.review(id, reason);
    if (!updated) {
      return res.status(404).json({ error: 'Candidato não encontrado.' });
    }

    return res.json({ data: updated });
  } catch (error: any) {
    console.error('[PATCH /aggregator/candidates/:id/review]', error);
    return res.status(500).json({ error: 'Erro ao enviar candidato para revisão.' });
  }
});

// PUT /api/v1/aggregator/candidates/:id — Editar parsed_json do candidato
router.put('/candidates/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { parsed_json } = req.body;

  if (!parsed_json || typeof parsed_json !== 'object') {
    return res.status(400).json({ error: 'Campo parsed_json é obrigatório e deve ser um objeto.' });
  }

  try {
    const updated = await candidateService.update(id, parsed_json as Record<string, unknown>);
    if (!updated) {
      return res.status(404).json({ error: 'Candidato não encontrado.' });
    }

    return res.json({ data: updated });
  } catch (error: any) {
    console.error('[PUT /aggregator/candidates/:id]', error);
    return res.status(500).json({ error: 'Erro ao atualizar candidato.' });
  }
});

// DELETE /api/v1/aggregator/candidates/:id — Deletar candidato permanentemente
router.delete('/candidates/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const deleted = await candidateService.deleteById(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Candidato não encontrado.' });
    }

    return res.json({ 
      data: { 
        message: 'Candidato deletado permanentemente com sucesso.',
        id 
      } 
    });
  } catch (error: any) {
    console.error('[DELETE /aggregator/candidates/:id]', error);
    return res.status(500).json({ error: 'Erro ao deletar candidato.' });
  }
});

// DELETE /api/v1/aggregator/candidates/bulk — Deletar múltiplos candidatos permanentemente
router.delete('/candidates/bulk', async (req: Request, res: Response) => {
  const { ids } = req.body;

  // Validação: ids deve ser array não-vazio
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Campo ids é obrigatório e deve ser um array não-vazio.' });
  }

  // Validação: todos os elementos devem ser strings
  if (!ids.every(id => typeof id === 'string')) {
    return res.status(400).json({ error: 'Todos os IDs devem ser strings.' });
  }

  // Validação: limite de 150 IDs por request
  if (ids.length > 150) {
    return res.status(400).json({ error: 'Máximo de 150 candidatos por operação.' });
  }

  try {
    const deleted = await candidateService.deleteBulk(ids);

    return res.json({ 
      data: { 
        message: `${deleted} candidato(s) deletado(s) permanentemente com sucesso.`,
        deleted,
        requested: ids.length
      } 
    });
  } catch (error: any) {
    console.error('[DELETE /aggregator/candidates/bulk]', error);
    return res.status(500).json({ error: 'Erro ao deletar candidatos em lote.' });
  }
});

export default router;

