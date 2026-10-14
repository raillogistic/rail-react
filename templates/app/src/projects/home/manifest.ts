/** Initial application page; register additional models and modules alongside it. */
import { createElement } from 'react';
import { Home } from 'lucide-react';
import { defineProjectManifest, protectedRoute, navGroup } from '@/app/router/manifestFactory';
import { HomePage } from './pages/HomePage';

export default defineProjectManifest({
  projectId: 'home', moduleId: 'core', order: 0, label: 'Accueil', icon: Home, defaultRoute: '/home',
  routes: [protectedRoute('home', { id: 'home:index', path: '/home', title: 'Accueil', element: createElement(HomePage) })],
  navigation: [navGroup('home', { id: 'home', label: 'Accueil', entries: [
    { id: 'home:index', routeId: 'home:index', title: 'Accueil', path: '/home', guard: 'protected' },
  ] })],
});
