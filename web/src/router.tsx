import { createBrowserRouter } from 'react-router';
import { RequireAuth } from './auth/RequireAuth.tsx';
import { RootLayout } from './layout/RootLayout.tsx';
import { MapPage } from './map/MapPage.tsx';
import { DesignPage } from './pages/DesignPage.tsx';
import { AccountPage } from './pages/AccountPage.tsx';
import { ActuPage } from './pages/ActuPage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { BlogPage } from './pages/BlogPage.tsx';
import { ArchivesPage } from './pages/ArchivesPage.tsx';
import { NotFoundPage } from './pages/PlaceholderPages.tsx';
import { ShopPage } from './pages/ShopPage.tsx';
import { LazyArticleEditPage, LazyArticlePage } from './pages/LazyArticlePages.tsx';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <MapPage /> },
      { path: '/shop', element: <ShopPage /> },
      { path: '/actu', element: <ActuPage /> },
      { path: '/blog', element: <BlogPage /> },
      {
        path: '/blog/nouveau',
        element: (
          <RequireAuth>
            <LazyArticleEditPage />
          </RequireAuth>
        ),
      },
      {
        path: '/blog/articles/:id',
        element: (
          <LazyArticlePage />
        ),
      },
      {
        path: '/blog/articles/:id/modifier',
        element: (
          <RequireAuth>
            <LazyArticleEditPage />
          </RequireAuth>
        ),
      },
      { path: '/archives', element: <ArchivesPage /> },
      { path: '/design', element: <DesignPage /> },
      { path: '/connexion', element: <LoginPage /> },
      {
        path: '/compte',
        element: (
          <RequireAuth>
            <AccountPage />
          </RequireAuth>
        ),
      },
      {
        path: '/admin',
        element: (
          <RequireAuth role="ADMIN">
            <AdminPage />
          </RequireAuth>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
