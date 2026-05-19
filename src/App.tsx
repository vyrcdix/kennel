import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import AgingBoard from './screens/AgingBoard';
import Dashboard from './screens/Dashboard';
import FieldNotesView from './screens/FieldNotesView';
import ProjectLanding from './screens/ProjectLanding';
import TriageQueue from './screens/TriageQueue';
import DocEditor from './screens/DocEditor';
import RunbookView from './screens/RunbookView';
import SkillProposal from './screens/SkillProposal';
import GlobalSearch from './screens/GlobalSearch';
import SettingsScreen from './screens/SettingsScreen';
import ComponentsBoard from './screens/ComponentsBoard';
import WeeklyReview from './screens/WeeklyReview';
import { CaptureModal } from './components/CaptureModal';
import { CreateProjectModal } from './components/CreateProjectModal';
import {
  openCreateProject,
  useCaptureModal,
  useCreateProjectModal,
} from './lib/modals';
import { toggleFocusMode } from './lib/focusMode';

const GlobalShortcuts = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        navigate('/search');
        return;
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        openCreateProject();
        return;
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFocusMode();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);
  return null;
};

const ModalHost = () => {
  const [createOpen, closeCreate] = useCreateProjectModal();
  const [capture, closeCapture] = useCaptureModal();
  return (
    <>
      <CreateProjectModal open={createOpen} onClose={closeCreate} />
      <CaptureModal
        open={capture.open}
        onClose={closeCapture}
        defaultProjectSlug={capture.projectSlug}
      />
    </>
  );
};

export const App = () => (
  <BrowserRouter>
    <GlobalShortcuts />
    <ModalHost />
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/project" element={<Navigate to="/project/kennel" replace />} />
      <Route path="/project/:slug" element={<ProjectLanding />} />
      <Route path="/triage" element={<TriageQueue />} />
      <Route path="/doc" element={<DocEditor />} />
      <Route path="/doc/:id" element={<DocEditor />} />
      <Route path="/runbook" element={<Navigate to="/runbook/kennel" replace />} />
      <Route path="/runbook/:slug" element={<RunbookView />} />
      <Route path="/project/:slug/field-notes" element={<FieldNotesView />} />
      <Route path="/aging" element={<AgingBoard />} />
      <Route path="/proposal" element={<SkillProposal />} />
      <Route path="/proposal/:id" element={<SkillProposal />} />
      <Route path="/search" element={<GlobalSearch />} />
      <Route path="/settings" element={<SettingsScreen />} />
      <Route path="/review/weekly" element={<WeeklyReview />} />
      <Route path="/components" element={<ComponentsBoard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
