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

export default router;
