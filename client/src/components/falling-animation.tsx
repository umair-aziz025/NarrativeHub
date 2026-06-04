import React, { useEffect, useState } from 'react';

interface Sparkle {
  id: number;
  x: number;
  duration: number;
  delay: number;
  size: number;
  symbol: string;
}

const FallingAnimation: React.FC = () => {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    const symbols = ['✨', '⭐', '🌟', '💫', '🔮', '🎯', '🎪', '🎨', '🎭', '🎬'];
    
    const generateSparkle = (id: number): Sparkle => ({
      id,
      x: Math.random() * 100, // Random position across screen width
      duration: 3 + Math.random() * 4, // 3-7 seconds fall duration
      delay: Math.random() * 2, // 0-2 seconds delay
      size: 0.8 + Math.random() * 0.7, // Size variation
      symbol: symbols[Math.floor(Math.random() * symbols.length)]
    });

    // Initial sparkles
    const initialSparkles = Array.from({ length: 8 }, (_, i) => generateSparkle(i));
    setSparkles(initialSparkles);

    // Continuously add new sparkles
    const interval = setInterval(() => {
      setSparkles(prev => {
        const newSparkle = generateSparkle(Date.now());
        // Keep only recent sparkles and add new one
        const filtered = prev.filter(sparkle => Date.now() - sparkle.id < 10000);
        return [...filtered, newSparkle];
      });
    }, 800 + Math.random() * 1200); // Add sparkle every 0.8-2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="falling-sparkles">
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="sparkle"
          style={{
            left: `${sparkle.x}%`,
            animationDuration: `${sparkle.duration}s`,
            animationDelay: `${sparkle.delay}s`,
            fontSize: `${sparkle.size}rem`,
          }}
        >
          {sparkle.symbol}
        </div>
      ))}
    </div>
  );
};

export default FallingAnimation;
