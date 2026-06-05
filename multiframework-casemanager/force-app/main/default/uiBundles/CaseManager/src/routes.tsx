import type { RouteObject } from 'react-router';
import AppLayout from '@/appLayout';
import Home from './pages/Home';
import Cases from './pages/Cases';
import NotFound from './pages/NotFound';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Home />,
        handle: { showInNavigation: true, label: 'Home' },
      },
      {
        path: 'cases',
        element: <Cases />,
        handle: { showInNavigation: true, label: 'Cases' },
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
];
