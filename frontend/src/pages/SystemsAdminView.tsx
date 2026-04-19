import { useEffect, useState, useMemo } from 'react';
import { AdminWorkspaceLayout } from '../features/admin/components/AdminWorkspaceLayout';
import { CatalogTree } from '../features/admin/components/CatalogTree';
import { CatalogToolbar } from '../features/admin/components/CatalogToolbar';
import { EntityInspector, type SystemFormData } from '../features/admin/components/EntityInspector';
import { useSystems } from '../modules/admin/systems/useSystems';
import { findInTree, countVisibleInTree } from '../features/admin/utils/treeHelpers';
import type { System } from '../modules/admin/systems/types';

export function SystemsAdminView() {
  const {
    systemsTree,
    loading,
    selectedId,
    setSelectedId,
    fetchTree,
    createSystem,
    updateSystem,
    deleteSystem,
  } = useSystems();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<Array<System['node_type']>>([]);
  const [inspectorMode, setInspectorMode] = useState<'edit' | 'create' | null>(null);
  const [parentContext, setParentContext] = useState<System | null>(null);

  useEffect(() => {
    fetchTree();
  }, []);

  const selectedSystem = useMemo(
    () => (selectedId ? findInTree(systemsTree, selectedId) : null),
    [systemsTree, selectedId]
  );

  const resultsCount = useMemo(
    () => countVisibleInTree(systemsTree, search, typeFilter),
    [systemsTree, search, typeFilter]
  );

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setInspectorMode('edit');
    setParentContext(null);
  };

  const handleCreateRoot = () => {
    setSelectedId(null);
    setInspectorMode('create');
    setParentContext(null);
  };

  const handleAddChild = (parent: System) => {
    setSelectedId(null);
    setInspectorMode('create');
    setParentContext(parent);
  };

  const handleSave = async (data: SystemFormData) => {
    if (inspectorMode === 'create') {
      const success = await createSystem(data);
      if (success) {
        setInspectorMode(null);
        setParentContext(null);
      }
    } else if (inspectorMode === 'edit' && selectedId) {
      const success = await updateSystem(selectedId, data);
      if (success) {
        // Mantém inspector aberto após salvar
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedSystem) return;
    await deleteSystem(selectedSystem.id, selectedSystem.name);
    setInspectorMode(null);
    setSelectedId(null);
  };

  const handleCancel = () => {
    setInspectorMode(null);
    setSelectedId(null);
    setParentContext(null);
  };

  const handleCloseInspector = () => {
    setInspectorMode(null);
    setSelectedId(null);
    setParentContext(null);
  };

  if (loading && systemsTree.length === 0) {
    return (
      <div className="py-12 text-center text-white/60">
        <p>Carregando sistemas...</p>
      </div>
    );
  }

  return (
    <AdminWorkspaceLayout
      workspace={
        <div className="flex flex-col h-full">
          <CatalogToolbar
            search={search}
            onSearchChange={setSearch}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            onCreateRoot={handleCreateRoot}
            resultsCount={resultsCount}
          />
          <div className="flex-1 overflow-hidden">
            <CatalogTree
              systems={systemsTree}
              selectedId={selectedId}
              onSelect={handleSelect}
              onAddChild={handleAddChild}
              search={search}
              typeFilter={typeFilter}
            />
          </div>
        </div>
      }
      inspector={
        inspectorMode ? (
          <EntityInspector
            mode={inspectorMode}
            system={selectedSystem}
            parentContext={parentContext}
            allSystems={systemsTree}
            onSave={handleSave}
            onDelete={inspectorMode === 'edit' ? handleDelete : undefined}
            onCancel={handleCancel}
          />
        ) : null
      }
      onCloseInspector={handleCloseInspector}
    />
  );
}
