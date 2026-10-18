import React, { useEffect, useRef, useState } from 'react';
import styles from './ChartTooltip.module.css';

export interface ChartTooltipProps {
  content: React.ReactNode;
  visible: boolean;
  anchorRect: DOMRect | null;
  onClose?: () => void;
}

export function ChartTooltip({
  content,
  visible,
  anchorRect,
  onClose,
}: ChartTooltipProps): React.ReactElement | null {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    if (!visible || !anchorRect) return;

    const updatePosition = () => {
      const tooltip = tooltipRef.current;
      const width = tooltip ? tooltip.offsetWidth : 160;
      const height = tooltip ? tooltip.offsetHeight : 32;

      let left = anchorRect.left + anchorRect.width / 2 - width / 2;
      let top = anchorRect.top - height - 8;

      // Flip below if not enough room on top
      if (top < 8) {
        top = anchorRect.bottom + 8;
      }

      // Clamp horizontally within viewport
      const padding = 8;
      const maxLeft = (typeof window !== 'undefined' ? window.innerWidth : 1000) - width - padding;
      left = Math.max(padding, Math.min(left, maxLeft));

      setCoords({ top, left });
    };

    updatePosition();
  }, [visible, anchorRect]);

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  if (!visible || !anchorRect) return null;

  return (
    <div
      ref={tooltipRef}
      role="tooltip"
      className={styles.tooltip}
      style={{
        top: `${coords.top}px`,
        left: `${coords.left}px`,
      }}
    >
      {content}
    </div>
  );
}
