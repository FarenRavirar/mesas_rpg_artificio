// GET /api/v1/gm/tables/:id — Obtém mesa específica para edição
router.get('/tables/:id', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { id } = req.params;

  try {
    const gmProfile = await db
      .selectFrom('gm_profiles')
      .select(['id'])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!gmProfile) {
      return res.status(403).json({ error: 'Perfil de mestre não encontrado.' });
    }

    const tableData = await getFullTableData(id, gmProfile.id);

    if (!tableData) {
      return res.status(404).json({ error: 'Mesa não encontrada ou sem permissão.' });
    }

    const responseData = {
      ...tableData,
      slots_available: (tableData.slots_total ?? 0) - (tableData.slots_filled ?? 0),
    };

    return res.json({ data: responseData });
  } catch (error: any) {
    console.error('[GET /gm/tables/:id]', error);
    return res.status(500).json({ error: 'Erro ao buscar mesa.' });
  }
});
