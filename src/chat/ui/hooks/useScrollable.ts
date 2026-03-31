import { useState, useCallback, useEffect } from 'react';

interface UseScrollableOptions {
  contentHeight: number;
  viewportHeight: number;
  isStreaming: boolean;
}

interface UseScrollableResult {
  scrollOffset: number;
  isAutoScroll: boolean;
  scrollUp: (lines?: number) => void;
  scrollDown: (lines?: number) => void;
  pageUp: () => void;
  pageDown: () => void;
  scrollToBottom: () => void;
}

export function useScrollable({
  contentHeight,
  viewportHeight,
  isStreaming,
}: UseScrollableOptions): UseScrollableResult {
  const maxOffset = Math.max(0, contentHeight - viewportHeight);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  useEffect(() => {
    if (isAutoScroll) {
      setScrollOffset(maxOffset);
    }
  }, [isAutoScroll, maxOffset]);

  const scrollUp = useCallback((lines = 1) => {
    setIsAutoScroll(false);
    setScrollOffset((prev) => Math.max(0, prev - lines));
  }, []);

  const scrollDown = useCallback((lines = 1) => {
    setScrollOffset((prev) => {
      const next = Math.min(maxOffset, prev + lines);
      if (next >= maxOffset) {
        setIsAutoScroll(true);
      }
      return next;
    });
  }, [maxOffset]);

  const pageUp = useCallback(() => {
    scrollUp(viewportHeight);
  }, [scrollUp, viewportHeight]);

  const pageDown = useCallback(() => {
    scrollDown(viewportHeight);
  }, [scrollDown, viewportHeight]);

  const scrollToBottom = useCallback(() => {
    setIsAutoScroll(true);
    setScrollOffset(maxOffset);
  }, [maxOffset]);

  useEffect(() => {
    if (!isStreaming && isAutoScroll) {
      setScrollOffset(maxOffset);
    }
  }, [isStreaming, isAutoScroll, maxOffset]);

  return {
    scrollOffset,
    isAutoScroll,
    scrollUp,
    scrollDown,
    pageUp,
    pageDown,
    scrollToBottom,
  };
}
