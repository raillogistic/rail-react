/** Register local configuration before mounting the shared application. */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { configureApplication } from '../rail/src/application';
import application from './application';
import './index.css';
configureApplication(application);
void import('../rail/src/App').then(({ default: App }) => {
  createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
});
