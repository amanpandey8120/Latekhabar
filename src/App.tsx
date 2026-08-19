import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Pages
import { Home } from './pages/public/Home';
import { CategoryNews } from './pages/public/CategoryNews';
import { LocalNews } from './pages/public/LocalNews';
import { ArticleDetail } from './pages/public/ArticleDetail';
import { SearchPage } from './pages/public/SearchPage';
import { SavedNews } from './pages/public/SavedNews';
import { Login } from './pages/public/Login';
import { Signup } from './pages/public/Signup';
import { ForgotPassword } from './pages/public/ForgotPassword';
import { ResetPassword } from './pages/public/ResetPassword';
import { Onboarding } from './pages/public/Onboarding';
import { Profile } from './pages/public/Profile';
import { NotFound } from './pages/public/NotFound';

// Admin Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { NewsManagement } from './pages/admin/NewsManagement';
import { AdminNewsFeed } from './pages/admin/AdminNewsFeed';
import { ArticleUpload } from './pages/admin/ArticleUpload';
import { CategoryManagement } from './pages/admin/CategoryManagement';
import { UserManagement } from './pages/admin/UserManagement';
import { AdminMedia } from './pages/admin/AdminMedia';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';

// Admin Route Guard
import AdminRoute from './components/admin/AdminRoute';

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* ── Public Website Routes ── */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/category/:slug" element={<CategoryNews />} />
                <Route path="/local" element={<LocalNews />} />
                <Route path="/article/:slug" element={<ArticleDetail />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/saved" element={<SavedNews />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* ── Admin Authentication (public, no guard) ── */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* ── Protected Admin Routes ──────────────────────────────────
                   AdminRoute  → fresh Supabase session + profiles.role check
                   AdminLayout → sidebar + main layout shell (no auth logic)
                  ────────────────────────────────────────────────────────── */}
              <Route element={<AdminRoute />}>
                <Route element={<AdminLayout />}>
                  {/* /admin → redirect to /admin/dashboard */}
                  <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/news" element={<AdminNewsFeed />} />
                  <Route path="/admin/articles" element={<NewsManagement />} />
                  <Route path="/admin/articles/create" element={<ArticleUpload />} />
                  <Route path="/admin/categories" element={<CategoryManagement />} />
                  <Route path="/admin/media" element={<AdminMedia />} />
                  <Route path="/admin/users" element={<UserManagement />} />
                  <Route path="/admin/analytics" element={<AdminAnalytics />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
