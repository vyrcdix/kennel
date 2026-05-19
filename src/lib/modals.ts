// Lightweight pub-sub for global modals. Components anywhere in the tree call
// openCreateProject() or openCapture(slug); a single host component (mounted
// at the App root) subscribes and renders the modal. Keeps trigger surfaces
// decoupled from where the modal actually lives.

import { useEffect, useState } from 'react';

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

export const openCreateProject = () => createProjectBus.emit();
export const openCapture = (projectSlug?: string) =>
  captureBus.emit({ projectSlug });

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
