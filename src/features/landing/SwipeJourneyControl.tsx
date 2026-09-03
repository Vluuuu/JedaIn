import {
  useCallback,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useNavigate } from "react-router";

export interface SwipeJourneyControlProps {
  onComplete?: () => void;
  targetRoute?: string;
  className?: string;
}

const THRESHOLD_RATIO = 0.68;

export function SwipeJourneyControl({
  onComplete,
  targetRoute = "/login",
  className = "",
}: SwipeJourneyControlProps) {
  const navigate = useNavigate();
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLButtonElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  const startYRef = useRef<number>(0);
  const maxTravelRef = useRef<number>(0);

  const [dragY, setDragY] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const finishJourney = useCallback(() => {
    setIsCompleted(true);
    setProgress(1);
    if (onComplete) {
      onComplete();
    }
    window.setTimeout(() => {
      navigate(targetRoute);
    }, 280);
  }, [navigate, onComplete, targetRoute]);

  const handlePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (isCompleted || e.button !== 0) return;

    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!track || !thumb) return;

    const trackRect = track.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const maxTravel = Math.max(0, trackRect.height - thumbRect.height - 8);

    maxTravelRef.current = maxTravel;
    startYRef.current = e.clientY;
    pointerIdRef.current = e.pointerId;

    thumb.setPointerCapture(e.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!isDragging || pointerIdRef.current !== e.pointerId) return;

    const deltaY = startYRef.current - e.clientY;
    const maxTravel = maxTravelRef.current;
    const clampedY = Math.max(0, Math.min(deltaY, maxTravel));
    const currentProgress = maxTravel > 0 ? clampedY / maxTravel : 0;

    setDragY(clampedY);
    setProgress(currentProgress);

    if (maxTravel > 0 && currentProgress >= THRESHOLD_RATIO) {
      setIsDragging(false);
      pointerIdRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // pointer capture already released
      }
      setDragY(maxTravel);
      finishJourney();
    }
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!isDragging || pointerIdRef.current !== e.pointerId) return;

    setIsDragging(false);
    pointerIdRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // pointer capture already released
    }

    const maxTravel = maxTravelRef.current;
    const currentProgress = maxTravel > 0 ? dragY / maxTravel : 0;
    if (maxTravel > 0 && currentProgress >= THRESHOLD_RATIO) {
      setDragY(maxTravel);
      finishJourney();
    } else {
      setDragY(0);
      setProgress(0);
    }
  };

  const handlePointerCancel = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current === e.pointerId) {
      setIsDragging(false);
      pointerIdRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // pointer capture already released
      }
      setDragY(0);
      setProgress(0);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const track = trackRef.current;
      const thumb = thumbRef.current;
      if (track && thumb) {
        const trackRect = track.getBoundingClientRect();
        const thumbRect = thumb.getBoundingClientRect();
        const maxTravel = Math.max(0, trackRect.height - thumbRect.height - 8);
        setDragY(maxTravel);
      }
      finishJourney();
    }
  };

  const labelOpacity = isCompleted
    ? 0
    : Math.max(0, (1 - progress * 1.45) * 0.72);
  const chevron1Opacity =
    isDragging || isCompleted ? 0.35 + progress * 0.65 : undefined;
  const chevron2Opacity =
    isDragging || isCompleted ? 0.55 + progress * 0.45 : undefined;

  return (
    <div
      ref={trackRef}
      className={`swipe-control ${isCompleted ? "swipe-control--completed" : ""} ${className}`.trim()}
      aria-hidden="false"
      style={
        {
          "--swipe-progress": progress.toString(),
        } as React.CSSProperties
      }
    >
      <div className="swipe-control__cues" aria-hidden="true">
        <div className="swipe-control__chevrons">
          <span
            className="swipe-control__chevron swipe-control__chevron--1"
            style={
              chevron1Opacity !== undefined
                ? { opacity: chevron1Opacity }
                : undefined
            }
          >
            <svg viewBox="0 0 16 10" width="14" height="9" fill="none">
              <path
                d="M1 8.5L8 1.5L15 8.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span
            className="swipe-control__chevron swipe-control__chevron--2"
            style={
              chevron2Opacity !== undefined
                ? { opacity: chevron2Opacity }
                : undefined
            }
          >
            <svg viewBox="0 0 16 10" width="14" height="9" fill="none">
              <path
                d="M1 8.5L8 1.5L15 8.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
        <span
          className="swipe-control__label"
          style={{
            opacity: labelOpacity,
            transition: isDragging ? "none" : "opacity 200ms ease",
          }}
        >
          mulai
        </span>
      </div>

      <button
        ref={thumbRef}
        type="button"
        className="swipe-control__thumb"
        style={{
          transform: `translate3d(0, -${dragY}px, 0)`,
          transition: isDragging
            ? "none"
            : "transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1), background-color 200ms ease",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onKeyDown={handleKeyDown}
        aria-label="Geser ke atas untuk memulai"
      >
        <span className="swipe-control__thumb-icon" aria-hidden="true">
          <svg viewBox="0 0 14 16" width="14" height="16" fill="none">
            <path
              d="M7 14.5V1.5M7 1.5L1.5 7M7 1.5L12.5 7"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
    </div>
  );
}
