import { Routes, Route } from 'react-router-dom';
import SignUp from './pages/Auth/SignUp';
import SignIn from './pages/Auth/SignIn';
import Dashboard from './pages/Admin/Dashboard';  // Admin Dashboard
import NavBar from './components/NavBar';  // Import the NavBar component
import ProtectedRoute from './routes/ProtectedRoute';

export default function App() {
  return (
    <div>
      {/* Add the NavBar here */}
      <NavBar />  

      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}
