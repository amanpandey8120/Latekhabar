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

// Route Guards
import AdminRoute from './components/admin/AdminRoute';
import { AdminOnlyRoute } from './components/admin/AdminOnlyRoute';

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

              {/* ── Protected Staff & Admin Routes ───────────────────────────
                   AdminRoute  → validates active Supabase session & profiles.role IN ('admin','author','writer')
                   AdminLayout → sidebar + main layout shell
                   AdminOnlyRoute → restricts specific routes to role === 'admin'
                  ────────────────────────────────────────────────────────── */}
              <Route element={<AdminRoute />}>
                <Route element={<AdminLayout />}>
                  {/* Redirect /admin to /admin/dashboard */}
                  <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                  
                  {/* Shared Staff Routes (Admin, Author, Writer) */}
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/articles" element={<NewsManagement />} />
                  <Route path="/admin/articles/create" element={<ArticleUpload />} />
                  <Route path="/admin/articles/new" element={<ArticleUpload />} />

                  {/* Admin-Only Routes */}
                  <Route
                    path="/admin/news"
                    element={
                      <AdminOnlyRoute>
                        <AdminNewsFeed />
                      </AdminOnlyRoute>
                    }
                  />
                  <Route
                    path="/admin/categories"
                    element={
                      <AdminOnlyRoute>
                        <CategoryManagement />
                      </AdminOnlyRoute>
                    }
                  />
                  <Route
                    path="/admin/media"
                    element={
                      <AdminOnlyRoute>
                        <AdminMedia />
                      </AdminOnlyRoute>
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      <AdminOnlyRoute>
                        <UserManagement />
                      </AdminOnlyRoute>
                    }
                  />
                  <Route
                    path="/admin/analytics"
                    element={
                      <AdminOnlyRoute>
                        <AdminAnalytics />
                      </AdminOnlyRoute>
                    }
                  />
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
