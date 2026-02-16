import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if (import.meta.env.DEV && typeof window !== "undefined") {
  const maxDevPerfEntries = 2000;
  const clearPerfTimelineIfNeeded = () => {
    const perf = window.performance;
    if (!perf || typeof perf.getEntriesByType !== "function") return;

    if (perf.getEntriesByType("measure").length > maxDevPerfEntries) {
      perf.clearMeasures();
    }
    if (perf.getEntriesByType("mark").length > maxDevPerfEntries) {
      perf.clearMarks();
    }
  };

  window.setInterval(clearPerfTimelineIfNeeded, 15_000);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
