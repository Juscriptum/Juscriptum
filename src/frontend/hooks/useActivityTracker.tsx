import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { logger } from "../services/logger.service";

interface UseActivityTrackerOptions {
  /** Track page views automatically */
  trackPageViews?: boolean;
  /** Track clicks */
  trackClicks?: boolean;
  /** Track form submissions */
  trackFormSubmits?: boolean;
  /** Track scroll depth */
  trackScrollDepth?: boolean;
  /** Track session duration */
  trackSessionDuration?: boolean;
  /** Debounce time for scroll tracking in ms */
  scrollDebounce?: number;
}

interface ClickEvent {
  tagName: string;
  id?: string;
  className?: string;
  text?: string;
  href?: string;
  x: number;
  y: number;
  timestamp: string;
}

/**
 * Hook for tracking user activity
 * Logs user interactions for debugging and analytics
 */
export function useActivityTracker(options: UseActivityTrackerOptions = {}) {
  const {
    trackPageViews = true,
    trackClicks = true,
    trackFormSubmits = true,
    trackScrollDepth = true,
    trackSessionDuration = true,
    scrollDebounce = 500,
  } = options;

  const location = useLocation();
  const sessionStart = useRef<Date>(new Date());
  const maxScrollDepth = useRef<number>(0);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPath = useRef<string>("");

  /**
   * Track page view
   */
  const trackPageView = useCallback((path: string) => {
    if (path !== lastPath.current) {
      logger.pageView(path, path);
      lastPath.current = path;

      // Reset scroll depth on new page
      maxScrollDepth.current = 0;
    }
  }, []);

  /**
   * Track click event
   */
  const trackClick = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;

    const clickData: ClickEvent = {
      tagName: target.tagName,
      id: target.id || undefined,
      className: target.className || undefined,
      text: target.textContent?.substring(0, 50) || undefined,
      href: (target as HTMLAnchorElement).href || undefined,
      x: event.clientX,
      y: event.clientY,
      timestamp: new Date().toISOString(),
    };

    logger.userAction("click", clickData);
  }, []);

  /**
   * Track form submission
   */
  const trackFormSubmit = useCallback((event: Event) => {
    const form = event.target as HTMLFormElement;

    logger.userAction("form_submit", {
      formId: form.id || undefined,
      formName: form.name || undefined,
      formAction: form.action || undefined,
      formMethod: form.method || undefined,
    });
  }, []);

  /**
   * Track scroll depth
   */
  const trackScroll = useCallback(() => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(() => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      // Track milestones: 25%, 50%, 75%, 100%
      const milestones = [25, 50, 75, 100];
      for (const milestone of milestones) {
        if (scrollPercent >= milestone && maxScrollDepth.current < milestone) {
          maxScrollDepth.current = milestone;
          logger.userAction("scroll_depth", {
            percent: milestone,
            path: window.location.pathname,
          });
        }
      }
    }, scrollDebounce);
  }, [scrollDebounce]);

  /**
   * Track session duration
   */
  const trackSessionEnd = useCallback(() => {
    const duration = Date.now() - sessionStart.current.getTime();
    logger.userAction("session_end", {
      durationMs: duration,
      durationSeconds: Math.round(duration / 1000),
      lastPath: window.location.pathname,
    });
  }, []);

  /**
   * Track page visibility changes
   */
  const trackVisibilityChange = useCallback(() => {
    if (document.hidden) {
      logger.userAction("page_hidden", {
        path: window.location.pathname,
        visibleTime: Date.now() - sessionStart.current.getTime(),
      });
    } else {
      logger.userAction("page_visible", {
        path: window.location.pathname,
      });
    }
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (trackPageViews) {
      trackPageView(location.pathname);
    }
  }, [location.pathname, trackPageViews, trackPageView]);

  // Setup event listeners
  useEffect(() => {
    if (trackClicks) {
      document.addEventListener("click", trackClick, true);
    }

    if (trackFormSubmits) {
      document.addEventListener("submit", trackFormSubmit, true);
    }

    if (trackScrollDepth) {
      window.addEventListener("scroll", trackScroll, { passive: true });
    }

    if (trackSessionDuration) {
      window.addEventListener("beforeunload", trackSessionEnd);
      document.addEventListener("visibilitychange", trackVisibilityChange);
    }

    // Cleanup
    return () => {
      if (trackClicks) {
        document.removeEventListener("click", trackClick, true);
      }

      if (trackFormSubmits) {
        document.removeEventListener("submit", trackFormSubmit, true);
      }

      if (trackScrollDepth) {
        window.removeEventListener("scroll", trackScroll);
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current);
        }
      }

      if (trackSessionDuration) {
        window.removeEventListener("beforeunload", trackSessionEnd);
        document.removeEventListener("visibilitychange", trackVisibilityChange);
      }
    };
  }, [
    trackClicks,
    trackFormSubmits,
    trackScrollDepth,
    trackSessionDuration,
    trackClick,
    trackFormSubmit,
    trackScroll,
    trackSessionEnd,
    trackVisibilityChange,
  ]);

  // Return manual tracking functions
  return {
    trackCustomEvent: (eventName: string, data?: Record<string, any>) => {
      logger.userAction(eventName, data);
    },
    trackError: (error: Error, context?: Record<string, any>) => {
      logger.error("User-reported error", error, "UserReport", context);
    },
    trackPerformance: (metric: string, value: number, unit?: string) => {
      logger.performance(metric, value, unit);
    },
  };
}

/**
 * HOC for wrapping components with activity tracking
 */
export function withActivityTracker<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: UseActivityTrackerOptions,
) {
  return function ActivityTrackedComponent(props: P) {
    useActivityTracker(options);
    return <WrappedComponent {...props} />;
  };
}
