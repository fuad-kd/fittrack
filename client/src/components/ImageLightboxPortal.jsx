import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

/**
 * Fullscreen image lightbox rendered directly into document.body via React Portal
 * at z-index: 9999 so parent modal z-index layers or GSAP transforms never clip or cover it.
 */
export default function ImageLightboxPortal({
  isOpen,
  items = [],
  currentIndex = 0,
  onIndexChange,
  onClose,
}) {
  const safeItems = Array.isArray(items) ? items.filter((item) => item && item.src) : [];
  const total = safeItems.length;
  const clampedIndex = total > 0 ? Math.min(Math.max(0, currentIndex), total - 1) : 0;
  const activeItem = total > 0 ? safeItems[clampedIndex] : null;
  const hasMultiple = total > 1;

  useEffect(() => {
    if (!isOpen || !activeItem) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (hasMultiple && e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        const prevIndex = (clampedIndex - 1 + total) % total;
        onIndexChange?.(prevIndex);
      } else if (hasMultiple && e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        const nextIndex = (clampedIndex + 1) % total;
        onIndexChange?.(nextIndex);
      }
    };

    // Capture phase ensures Esc / Arrow keys don't bubble to underlying modals
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, activeItem, hasMultiple, clampedIndex, total, onIndexChange, onClose]);

  if (!isOpen || !activeItem || typeof document === 'undefined') {
    return null;
  }

  const handlePrev = (e) => {
    e.stopPropagation();
    if (!hasMultiple) return;
    onIndexChange?.((clampedIndex - 1 + total) % total);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (!hasMultiple) return;
    onIndexChange?.((clampedIndex + 1) % total);
  };

  return createPortal(
    <div
      className="ft-portal-lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={activeItem.title || 'Fullscreen diagram viewer'}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="ft-portal-lightbox-shell"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="ft-portal-lightbox-topbar">
          <div className="ft-portal-lightbox-titles">
            <div className="ft-portal-lightbox-badges">
              <span className="ft-portal-lightbox-badge">
                {activeItem.badge || 'High-Resolution Reference'}
              </span>
              {hasMultiple && (
                <span className="ft-portal-lightbox-counter">
                  {clampedIndex + 1} / {total}
                </span>
              )}
            </div>
            <h3>{activeItem.title}</h3>
            {activeItem.subtitle && <p>{activeItem.subtitle}</p>}
          </div>

          <button
            type="button"
            className="ft-portal-lightbox-close"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Close full view (Esc)"
            aria-label="Close fullscreen viewer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Fullscreen Image Viewport */}
        <div className="ft-portal-lightbox-viewport">
          {hasMultiple && (
            <button
              type="button"
              className="ft-portal-lightbox-nav prev"
              onClick={handlePrev}
              title="Previous diagram (Left Arrow)"
              aria-label="Previous diagram"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          <img
            src={activeItem.src}
            alt={activeItem.title || 'Exercise Diagram'}
            className="ft-portal-lightbox-img"
          />

          {hasMultiple && (
            <button
              type="button"
              className="ft-portal-lightbox-nav next"
              onClick={handleNext}
              title="Next diagram (Right Arrow)"
              aria-label="Next diagram"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>

        {/* Description & Keyboard Controls Footer */}
        <div className="ft-portal-lightbox-footer">
          {activeItem.description && (
            <p className="ft-portal-lightbox-desc">{activeItem.description}</p>
          )}
          <div className="ft-portal-lightbox-hints">
            <span>Click backdrop or press Esc to close</span>
            {hasMultiple && <span>Use ← / → arrows or buttons to switch diagrams</span>}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
