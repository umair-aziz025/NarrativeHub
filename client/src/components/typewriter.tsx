import React, { useState, useEffect, useRef } from 'react';

interface TypeWriterProps {
  text: string;
  className?: string;
  delay?: number;
  onComplete?: () => void;
}

const TypeWriter: React.FC<TypeWriterProps> = ({ 
  text, 
  className = "", 
  delay = 100, 
  onComplete 
}) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const elementRef = useRef<HTMLHeadingElement>(null);

  // Intersection Observer to detect when element is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setIsVisible(true);
          setHasStarted(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  // Reset when scrolling back up
  useEffect(() => {
    const handleScroll = () => {
      if (elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect();
        const isInViewport = rect.top >= 0 && rect.bottom <= window.innerHeight;
        
        if (!isInViewport && hasStarted) {
          // Reset animation when out of view
          setDisplayText("");
          setCurrentIndex(0);
          setHasStarted(false);
          setIsVisible(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasStarted]);

  // TypeWriter effect
  useEffect(() => {
    if (!isVisible || currentIndex >= text.length) {
      if (currentIndex >= text.length && onComplete) {
        onComplete();
      }
      return;
    }

    const timeout = setTimeout(() => {
      setDisplayText(prev => prev + text[currentIndex]);
      setCurrentIndex(prev => prev + 1);
    }, delay);

    return () => clearTimeout(timeout);
  }, [currentIndex, isVisible, text, delay, onComplete]);

  return (
    <h2 
      ref={elementRef}
      className={`${className} ${hasStarted ? 'animate-fade-in' : ''}`}
    >
      {displayText}
      <span className="animate-pulse">|</span>
    </h2>
  );
};

export default TypeWriter;
