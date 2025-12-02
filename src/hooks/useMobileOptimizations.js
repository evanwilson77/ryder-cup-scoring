import { useEffect, useState, useCallback } from 'react';

/**
 * Custom hook for mobile optimizations including:
 * - Pull to refresh
 * - PWA install prompt
 * - Touch gestures
 * - Performance monitoring
 */
export const useMobileOptimizations = () => {
  const [pullToRefreshDistance, setPullToRefreshDistance] = useState(0);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Pull to refresh
  useEffect(() => {
    let startY = 0;
    let currentY = 0;
    let isPulling = false;

    const handleTouchStart = (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!isPulling) return;

      currentY = e.touches[0].clientY;
      const distance = currentY - startY;

      if (distance > 0 && distance < 150) {
        setPullToRefreshDistance(distance);
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (pullToRefreshDistance > 80) {
        // Trigger refresh
        window.location.reload();
      }

      setPullToRefreshDistance(0);
      isPulling = false;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullToRefreshDistance]);

  // PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Check if user has dismissed prompt before
      const hasPromptDismissed = localStorage.getItem('pwa-prompt-dismissed');

      if (!hasPromptDismissed) {
        // Show after 30 seconds
        setTimeout(() => {
          setShowPWAPrompt(true);
        }, 30000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('App is running in standalone mode');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installPWA = useCallback(async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowPWAPrompt(false);
  }, [deferredPrompt]);

  const dismissPWAPrompt = useCallback(() => {
    setShowPWAPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  }, []);

  return {
    pullToRefreshDistance,
    showPWAPrompt,
    installPWA,
    dismissPWAPrompt
  };
};

/**
 * Hook for lazy loading images
 */
export const useLazyLoad = (ref) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px'
      }
    );

    const element = ref.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [ref]);

  return isVisible;
};

/**
 * Hook for detecting swipe gestures
 */
export const useSwipeGesture = (onSwipeLeft, onSwipeRight, threshold = 50) => {
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const deltaX = endX - startX;
      const deltaY = endY - startY;

      // Check if horizontal swipe (more horizontal than vertical)
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > threshold) {
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight();
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft();
          }
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, threshold]);
};

/**
 * Hook for performance monitoring
 */
export const usePerformanceMonitor = () => {
  useEffect(() => {
    // Monitor page load performance
    if ('performance' in window) {
      window.addEventListener('load', () => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`Page load time: ${pageLoadTime}ms`);

        // Log slow loads (> 3 seconds)
        if (pageLoadTime > 3000) {
          console.warn('Slow page load detected');
        }
      });
    }

    // Monitor memory usage (Chrome only)
    if ('memory' in performance) {
      const logMemory = () => {
        const memory = performance.memory;
        console.log(`Memory usage: ${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`);
      };

      const memoryInterval = setInterval(logMemory, 30000); // Log every 30 seconds

      return () => clearInterval(memoryInterval);
    }
  }, []);
};
