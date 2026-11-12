import { createBrowserRouter } from 'react-router';
import { RootLayout } from './layout/RootLayout.tsx';
import { MapPage } from './map/MapPage.tsx';
import { DesignPage } from './pages/DesignPage.tsx';
import { ActuPage } from './pages/ActuPage.tsx';
import { ArchivesPage, BlogPage, NotFoundPage } from './pages/PlaceholderPages.tsx';
import { ShopPage } from './pages/ShopPage.tsx';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <MapPage /> },
      { path: '/shop', element: <ShopPage /> },
      { path: '/actu', element: <ActuPage /> },
      { path: '/blog', element: <BlogPage /> },
      { path: '/archives', element: <ArchivesPage /> },
      { path: '/design', element: <DesignPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
