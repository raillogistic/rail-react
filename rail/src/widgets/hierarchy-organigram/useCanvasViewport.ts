/**
 * Hook useCanvasViewport — gestion du pan & zoom du canevas.
 *
 * Fournit :
 * - Glisser-déplacer avec le curseur (mousedown + mousemove)
 * - Zoom au scroll (wheel)
 * - Zoom par boutons (zoomIn, zoomOut, resetView)
 * - Centrage automatique (fitToCenter)
 */
import { useCallback, useRef, useState, useEffect } from "react";
import type { ViewportState } from "./types";

/** Limites du facteur de zoom. */
const MIN_SCALE = 0.15;
const MAX_SCALE = 2.5;
const ZOOM_STEP = 0.08;
const WHEEL_ZOOM_FACTOR = 0.001;

/**
 * Hook de gestion du viewport (pan & zoom) pour le canevas interactif.
 *
 * @returns Objet contenant le viewport, les refs, et les handlers d'interaction.
 */
export function useCanvasViewport() {
  const [viewport, setViewport] = useState<ViewportState>({
    x: 0,
    y: 0,
    scale: 0.75,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastViewport = useRef({ x: 0, y: 0 });

  // ── Handlers de drag (pan) ──
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Ne pas intercepter les clics sur les éléments interactifs
      const target = e.target as HTMLElement;
      if (target.closest("button, [role='menuitem'], [data-interactive]")) return;

      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      lastViewport.current = { x: viewport.x, y: viewport.y };
      e.preventDefault();
    },
    [viewport.x, viewport.y],
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setViewport((v) => ({
      ...v,
      x: lastViewport.current.x + dx,
      y: lastViewport.current.y + dy,
    }));
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // ── Zoom au scroll ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * WHEEL_ZOOM_FACTOR;
      setViewport((v) => {
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale + delta));
        // Zoom centré sur le curseur
        const rect = container.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const ratio = newScale / v.scale;
        return {
          scale: newScale,
          x: cx - ratio * (cx - v.x),
          y: cy - ratio * (cy - v.y),
        };
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  // ── Actions de zoom par bouton ──
  const zoomIn = useCallback(() => {
    setViewport((v) => ({
      ...v,
      scale: Math.min(MAX_SCALE, +(v.scale + ZOOM_STEP).toFixed(2)),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setViewport((v) => ({
      ...v,
      scale: Math.max(MIN_SCALE, +(v.scale - ZOOM_STEP).toFixed(2)),
    }));
  }, []);

  const resetView = useCallback(() => {
    setViewport({ x: 0, y: 0, scale: 0.75 });
  }, []);

  const fitToCenter = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setViewport({
      x: rect.width / 2 - 150,
      y: 40,
      scale: 0.75,
    });
  }, []);

  return {
    viewport,
    containerRef,
    isDragging: isDragging.current,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
    },
    zoomIn,
    zoomOut,
    resetView,
    fitToCenter,
  };
}
