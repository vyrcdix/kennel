// Lightweight pub-sub for global modals. Components anywhere in the tree call
// openCreateProject() or openCapture(slug); a single host component (mounted
// at the App root) subscribes and renders the modal. Keeps trigger surfaces
// decoupled from where the modal actually lives.

import { useEffect, useState } from 'react';
import type { Item } from '../data/types';

type Listener<T> = (payload: T) => void;
const createBus = <T = void>() => {
  const listeners = new Set<Listener<T>>();
  return {
    emit: (payload: T) => listeners.forEach((l) => l(payload)),
    subscribe: (cb: Listener<T>) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
  };
};

const createProjectBus = createBus<void>();
const captureBus = createBus<{ projectSlug?: string }>();
const editItemBus = createBus<{ itemId: string }>();
const pasteRouteBus = createBus<{ projectSlug?: string }>();

/** Seed for "Make it recur". Either recur an existing bench item (itemId), or
 *  create a new recurring action (text + projectId) — e.g. from a crystal,
 *  pre-attached via servesId. */
export type RecurSeed = {
  itemId?: string;
  text?: string;
  projectId?: string;
  servesId?: string;
};
const recurBus = createBus<RecurSeed>();

export const openCreateProject = () => createProjectBus.emit();
export const openCapture = (projectSlug?: string) =>
  captureBus.emit({ projectSlug });
export const openEditItem = (itemId: string) => editItemBus.emit({ itemId });
export const openRecur = (seed: RecurSeed = {}) => recurBus.emit(seed);

/** The one "where does clicking an item take you" policy, shared by every
 *  row surface (NextUp, aging strips, Weekly Review, connections). Doc-backed
 *  items open the editor — the content lives in the doc, even for crystals.
 *  Other crystals open their detail; raw items open the edit modal. */
export const openItem = (item: Item, navigate: (to: string) => void) => {
  if (item.docId) {
    navigate(`/doc/${item.docId}`);
  } else if (item.kind === 'crystallization' || item.state === 'crystallized') {
    navigate(`/crystal/${item.id}`);
  } else {
    openEditItem(item.id);
  }
};
export const openPasteRoute = (projectSlug?: string) =>
  pasteRouteBus.emit({ projectSlug });

export const useCreateProjectModal = () => {
  const [open, setOpen] = useState(false);
  useEffect(() => createProjectBus.subscribe(() => setOpen(true)), []);
  return [open, () => setOpen(false)] as const;
};

export type CaptureModalState = { open: boolean; projectSlug?: string };

export const useCaptureModal = (): [CaptureModalState, () => void] => {
  const [state, setState] = useState<CaptureModalState>({ open: false });
  useEffect(
    () =>
      captureBus.subscribe(({ projectSlug }) =>
        setState({ open: true, projectSlug }),
      ),
    [],
  );
  return [state, () => setState({ open: false })];
};

export type EditItemModalState = { open: boolean; itemId?: string };

export const useEditItemModal = (): [EditItemModalState, () => void] => {
  const [state, setState] = useState<EditItemModalState>({ open: false });
  useEffect(
    () => editItemBus.subscribe(({ itemId }) => setState({ open: true, itemId })),
    [],
  );
  return [state, () => setState({ open: false })];
};

export type PasteRouteModalState = { open: boolean; projectSlug?: string };

export const usePasteRouteModal = (): [PasteRouteModalState, () => void] => {
  const [state, setState] = useState<PasteRouteModalState>({ open: false });
  useEffect(
    () =>
      pasteRouteBus.subscribe(({ projectSlug }) =>
        setState({ open: true, projectSlug }),
      ),
    [],
  );
  return [state, () => setState({ open: false })];
};

export type RecurModalState = { open: boolean; seed: RecurSeed };

export const useRecurModal = (): [RecurModalState, () => void] => {
  const [state, setState] = useState<RecurModalState>({ open: false, seed: {} });
  useEffect(
    () => recurBus.subscribe((seed) => setState({ open: true, seed })),
    [],
  );
  return [state, () => setState({ open: false, seed: {} })];
};
