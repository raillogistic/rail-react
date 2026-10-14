/** Mount the shared Rail application with this project's configuration. */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../rail/src/App';
import './index.css';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
