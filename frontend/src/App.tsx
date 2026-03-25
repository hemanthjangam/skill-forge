import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './components/ThemeProvider'
import { AuthLayout } from './layouts/AuthLayout'
import { DashboardLayout } from './layouts/DashboardLayout'
import { useAuthStore } from './store/useAuthStore'
import { ErrorBoundary } from './components/shared/ErrorBoundary'

import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'
import { VerifyOtp } from './pages/auth/VerifyOtp'
import { ForgotPassword } from './pages/auth/ForgotPassword'
import { ResetPassword } from './pages/auth/ResetPassword'

import { StudentDashboard } from './pages/student/Dashboard'
import { CourseList } from './pages/student/CourseList'
import { CourseDetail } from './pages/student/CourseDetail'
import { CoursePlayer } from './pages/student/CoursePlayer'
import { QuizSession } from './pages/student/QuizSession'
import { QuizResult } from './pages/student/QuizResult'
import { Leaderboard } from './pages/student/Leaderboard'
import { SkillMastery } from './pages/student/SkillMastery'
import { TrainerDashboard } from './pages/trainer/Dashboard'
import { CourseBuilder } from './pages/trainer/CourseBuilder'
import { AdminDashboard } from './pages/admin/Dashboard'
import { UserManagement } from './pages/admin/UserManagement'
import { CourseModeration } from './pages/admin/CourseModeration'
import { Profile } from './pages/shared/Profile'

const queryClient = new QueryClient()

// Smart root redirect based on role
const RoleRedirect = () => {
  const { isAuthenticated, role } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role === 'STUDENT') return <Navigate to="/student" replace />
  if (role === 'TRAINER') return <Navigate to="/trainer" replace />
  if (role === 'ADMIN') return <Navigate to="/admin" replace />
  return <Navigate to="/login" replace />
}

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { isAuthenticated, role } = useAuthStore()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              {/* Smart root redirect */}
              <Route path="/" element={<RoleRedirect />} />

              {/* Shared Routes */}
              <Route path="/profile" element={<Profile />} />

              {/* Student Routes */}
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/courses" element={<CourseList />} />
              <Route path="/student/courses/:courseId" element={<CourseDetail />} />
              <Route path="/student/courses/:courseId/player" element={<CoursePlayer />} />
              <Route path="/student/courses/:courseId/quiz/:quizId" element={<QuizSession />} />
              <Route path="/student/quiz/:quizId/result" element={<QuizResult />} />
              <Route path="/student/skills" element={<SkillMastery />} />
              <Route path="/student/leaderboard" element={<Leaderboard />} />

              {/* Trainer Routes */}
              <Route path="/trainer" element={<TrainerDashboard />} />
              <Route path="/trainer/courses" element={<TrainerDashboard />} />
              <Route path="/trainer/courses/new" element={<CourseBuilder />} />
              <Route path="/trainer/courses/:courseId/edit" element={<CourseBuilder />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/courses" element={<CourseModeration />} />
              <Route path="/admin/courses/:courseId/review" element={<CoursePlayer />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
