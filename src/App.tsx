import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { Onboarding } from './pages/public/Onboarding';
import { Profile } from './pages/public/Profile';
import { NotFound } from './pages/public/NotFound';

// Admin Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { Dashboard } from './pages/admin/Dashboard';
import { NewsManagement } from './pages/admin/NewsManagement';
import { ArticleUpload } from './pages/admin/ArticleUpload';
import { CategoryManagement } from './pages/admin/CategoryManagement';
import { UserManagement } from './pages/admin/UserManagement';

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Website Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/category/:slug" element={<CategoryNews />} />
                <Route path="/local" element={<LocalNews />} />
                <Route path="/article/:slug" element={<ArticleDetail />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/saved" element={<SavedNews />} />
                <Route path="/login" element={<Login />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* Admin Portal Authentication */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Protected Admin Routes */}
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<Dashboard />} />
                <Route path="/admin/articles" element={<NewsManagement />} />
                <Route path="/admin/articles/create" element={<ArticleUpload />} />
                <Route path="/admin/categories" element={<CategoryManagement />} />
                <Route path="/admin/users" element={<UserManagement />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
