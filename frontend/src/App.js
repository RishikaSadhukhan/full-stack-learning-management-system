import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import './styles/global.css';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Instructor pages
import InstructorDashboard from './pages/instructor/Dashboard';
import InstructorCourses from './pages/instructor/Courses';
import CourseBuilder from './pages/instructor/CourseBuilder';
import AssignmentManager from './pages/instructor/AssignmentManager';
import StudentAnalytics from './pages/instructor/StudentAnalytics';
import GradeSubmissions from './pages/instructor/GradeSubmissions';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import CourseBrowse from './pages/student/CourseBrowse';
import CourseView from './pages/student/CourseView';
import LessonPlayer from './pages/student/LessonPlayer';
import Assignments from './pages/student/Assignments';
import Certificates from './pages/student/Certificates';
import Notifications from './pages/student/Notifications';

// Shared
import Layout from './components/common/Layout';

const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
};

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'instructor') return <Navigate to="/instructor/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' },
              success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
          <Routes>
            <Route path="/" element={<RoleRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Instructor Routes */}
            <Route path="/instructor" element={
              <ProtectedRoute role="instructor"><Layout /></ProtectedRoute>
            }>
              <Route path="dashboard" element={<InstructorDashboard />} />
              <Route path="courses" element={<InstructorCourses />} />
              <Route path="courses/new" element={<CourseBuilder />} />
              <Route path="courses/:id/edit" element={<CourseBuilder />} />
              <Route path="courses/:id/assignments" element={<AssignmentManager />} />
              <Route path="courses/:id/assignments/:assignmentId/submissions" element={<GradeSubmissions />} />
              <Route path="courses/:id/analytics" element={<StudentAnalytics />} />
            </Route>

            {/* Student Routes */}
            <Route path="/student" element={
              <ProtectedRoute role="student"><Layout /></ProtectedRoute>
            }>
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="courses" element={<CourseBrowse />} />
              <Route path="courses/:id" element={<CourseView />} />
              <Route path="courses/:id/lessons/:lessonId" element={<LessonPlayer />} />
              <Route path="assignments" element={<Assignments />} />
              <Route path="certificates" element={<Certificates />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
