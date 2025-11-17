import { useState, useRef } from 'react';

interface CircularRatingProps {
  value: number; // 0-100
  size?: 'sm' | 'lg';
  label?: string;
  showValue?: boolean;
  interactive?: boolean;
  onChange?: (value: number) => void;
}

export const CircularRating = ({ 
  value, 
  size = 'sm', 
  label,
  showValue = true,
  interactive = false,
  onChange
}: CircularRatingProps) => {
  const [currentValue, setCurrentValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const radius = size === 'sm' ? 40 : 80;
  const strokeWidth = size === 'sm' ? 8 : 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const displayValue = interactive ? currentValue : value;
  const strokeDashoffset = circumference - (displayValue / 100) * circumference;
  const svgSize = radius * 2;

  const calculateValueFromEvent = (e: React.MouseEvent | React.TouchEvent) => {
    if (!svgRef.current || !interactive) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    angle = (angle + 90 + 360) % 360;
    
    const newValue = Math.round((angle / 360) * 100);
    setCurrentValue(newValue);
    onChange?.(newValue);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    setIsDragging(true);
    calculateValueFromEvent(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!interactive || !isDragging) return;
    calculateValueFromEvent(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!interactive) return;
    setIsDragging(true);
    calculateValueFromEvent(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!interactive || !isDragging) return;
    calculateValueFromEvent(e);
  };

  return (
    <div 
      className="flex flex-col items-center gap-2"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      <div 
        className="relative" 
        style={{ width: svgSize, height: svgSize }}
      >
        <svg
          ref={svgRef}
          height={svgSize}
          width={svgSize}
          className={`-rotate-90 ${interactive ? 'cursor-pointer' : ''}`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Background circle */}
          <circle
            stroke="hsl(0 0% 15%)"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle */}
          <circle
            stroke="hsl(142 86% 50%)"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ 
              strokeDashoffset,
              transition: isDragging ? 'none' : 'stroke-dashoffset 0.6s ease-in-out',
              filter: 'drop-shadow(0 0 8px hsl(142 86% 50% / 0.5))'
            }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className={`font-black text-primary ${size === 'sm' ? 'text-lg' : 'text-4xl'}`}>
              {Math.round(displayValue)}
            </span>
          </div>
        )}
      </div>
      {label && (
        <span className="text-xs text-muted-foreground uppercase tracking-wider text-center">
          {label}
        </span>
      )}
    </div>
  );
};
