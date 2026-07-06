import { Navigate, Route, Routes } from 'react-router';
import { Layout } from './components/Layout';
import { ProblemListPage } from './pages/ProblemListPage';
import { ProblemPage } from './pages/ProblemPage';
import { SettingsPage } from './pages/SettingsPage';
import { PROBLEMS } from './problems';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<ProblemListPage />} />
        <Route path="problems/:problemId" element={<ProblemPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to={`/problems/${PROBLEMS[0].id}`} replace />} />
      </Route>
    </Routes>
  );
}
