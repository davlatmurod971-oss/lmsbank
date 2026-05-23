import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

// Pages
import LoginPage from './pages/auth/LoginPage';
import HRLayout from './pages/hr/HRLayout';
import HRDashboard from './pages/hr/HRDashboard';
import HREmployees from './pages/hr/HREmployees';
import HREmployeeDetail from './pages/hr/HREmployeeDetail';
import HRCareerTracks from './pages/hr/HRCareerTracks';
import HRTrainings from './pages/hr/HRTrainings';
import HRPromotion from './pages/hr/HRPromotion';
import HRReports from './pages/hr/HRReports';
import HRBranches from './pages/hr/HRBranches';

import ManagerLayout from './pages/manager/ManagerLayout';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerTeam from './pages/manager/ManagerTeam';
import ManagerFeedback from './pages/manager/ManagerFeedback';
import ManagerPromotion from './pages/manager/ManagerPromotion';

import EmployeeLayout from './pages/employee/EmployeeLayout';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeLearningPath from './pages/employee/EmployeeLearningPath';
import EmployeeTrainings from './pages/employee/EmployeeTrainings';
import EmployeeProfile from './pages/employee/EmployeeProfile';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="spinner" style={{width:32,height:32}} /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
}

function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="spinner" style={{width:32,height:32}} /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'HR_MANAGER' || user.role === 'ADMIN') return <Navigate to="/hr/dashboard" replace />;
  if (user.role === 'BRANCH_MANAGER') return <Navigate to="/manager/dashboard" replace />;
  return <Navigate to="/employee/dashboard" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RoleRedirect />} />
          
          {/* HR Routes */}
          <Route path="/hr" element={
            <ProtectedRoute roles={['HR_MANAGER', 'ADMIN']}>
              <HRLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<HRDashboard />} />
            <Route path="employees" element={<HREmployees />} />
            <Route path="employees/:id" element={<HREmployeeDetail />} />
            <Route path="career-tracks" element={<HRCareerTracks />} />
            <Route path="trainings" element={<HRTrainings />} />
            <Route path="promotion-packets" element={<HRPromotion />} />
            <Route path="reports" element={<HRReports />} />
            <Route path="branches" element={<HRBranches />} />
          </Route>

          {/* Manager Routes */}
          <Route path="/manager" element={
            <ProtectedRoute roles={['BRANCH_MANAGER']}>
              <ManagerLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="team" element={<ManagerTeam />} />
            <Route path="feedback" element={<ManagerFeedback />} />
            <Route path="promotion-packets" element={<ManagerPromotion />} />
          </Route>

          {/* Employee Routes */}
          <Route path="/employee" element={
            <ProtectedRoute roles={['EMPLOYEE']}>
              <EmployeeLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="learning-path" element={<EmployeeLearningPath />} />
            <Route path="trainings" element={<EmployeeTrainings />} />
            <Route path="profile" element={<EmployeeProfile />} />
          </Route>

          <Route path="/unauthorized" element={
            <div className="page-loading" style={{flexDirection:'column',gap:16}}>
              <h2>Ruxsat yo'q</h2>
              <p>Bu sahifaga kirishga ruxsatingiz yo'q.</p>
            </div>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
