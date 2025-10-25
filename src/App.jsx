import { Routes, Route } from 'react-router-dom';
import SignUp from './pages/Auth/SignUp';
import SignIn from './pages/Auth/SignIn';
import Dashboard from './pages/Admin/Dashboard';
import ProtectedRoute from './routes/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/signup" element={<SignUp />} />
      <Route path="/signin" element={<SignIn />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
