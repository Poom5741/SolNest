import React, { useEffect, useState, useRef } from "react";
import { animate, motion } from "motion/react";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  className?: string;
  flashColor?: string; // Optional custom color to flash to (e.g., green, amber)
}

export default function AnimatedNumber({ 
  value, 
  decimals = 3, 
  className = "",
  flashColor
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  
  // Controls the micro-animation pulse state
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    if (value === prevValueRef.current) return;

    // Increment pulseCount to trigger the animation sequence
    setPulseCount(prev => prev + 1);

    const controls = animate(prevValueRef.current, value, {
      duration: 2.0,
      ease: [0.16, 1, 0.3, 1], // Ultra smooth easeOutExpo
      onUpdate: (latest) => {
        setDisplayValue(latest);
      },
    });

    prevValueRef.current = value;
    
    return () => {
      controls.stop();
    };
  }, [value]);

  // If a custom flash color is specified, we animate scale and color. Otherwise, we just animate scale.
  const animationVariants = {
    pulse: {
      scale: [1, 1.15, 1],
      y: [0, -2, 0],
      ...(flashColor ? { color: ["rgba(0,0,0,0)", flashColor, "rgba(0,0,0,0)"] } : {})
    }
  };

  return (
    <div className="inline-flex items-center relative justify-center">
      {/* Background flash layer for absolute premium glow feel if flashColor is defined */}
      {flashColor && (
        <motion.span
          key={`glow-${pulseCount}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={pulseCount > 0 ? {
            opacity: [0, 0.4, 0],
            scale: [0.8, 1.4, 1.6],
          } : { opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ backgroundColor: flashColor }}
          className="absolute -inset-2 rounded-full blur-md -z-10 pointer-events-none"
        />
      )}
      
      <motion.span
        key={`num-${pulseCount}`}
        animate={pulseCount > 0 ? {
          scale: [1, 1.08, 1],
          textShadow: flashColor ? [
            "0px 0px 0px rgba(0,0,0,0)",
            `0px 0px 8px ${flashColor}`,
            "0px 0px 0px rgba(0,0,0,0)"
          ] : []
        } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`inline-block origin-center font-mono select-none ${className}`}
      >
        {displayValue.toFixed(decimals)}
      </motion.span>
    </div>
  );
}
