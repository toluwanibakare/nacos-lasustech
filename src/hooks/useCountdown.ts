import { useState, useEffect, useMemo } from "react";

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

interface CountdownOptions {
  fastMode?: boolean;
  fastModeKey?: string;
  oldTargetDate?: Date;
}

export function useCountdown(targetDate: Date, options?: CountdownOptions): CountdownResult {
  // Memoize targetDate time to prevent infinite re-renders if passed a new Date object every render
  const targetTime = useMemo(() => targetDate.getTime(), [targetDate.getTime()]);
  
  const getRealDiff = () => targetTime - Date.now();
  
  const diffToResult = (diff: number): CountdownResult => {
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000) / 60_000);
    const seconds = Math.floor((diff % 60_000) / 1_000);
    return { days, hours, minutes, seconds, expired: false };
  };

  const [state, setState] = useState<CountdownResult>(() => {
    if (typeof window !== 'undefined' && options?.fastMode && options?.fastModeKey && options?.oldTargetDate && !localStorage.getItem(options.fastModeKey)) {
      const oldDiff = options.oldTargetDate.getTime() - Date.now();
      return diffToResult(oldDiff); // Start exactly from the old date's difference
    }
    return diffToResult(getRealDiff());
  });

  useEffect(() => {
    let intervalId: any;
    let animationFrameId: number;

    const startNormal = () => {
      intervalId = setInterval(() => setState(diffToResult(getRealDiff())), 1000);
    };

    if (options?.fastMode && options?.fastModeKey && options?.oldTargetDate && !localStorage.getItem(options.fastModeKey)) {
      const realDiff = getRealDiff();
      const oldDiff = options.oldTargetDate.getTime() - Date.now();
      const extraDiff = oldDiff - realDiff; 
      const duration = 2500; // 2.5 seconds
      const startTime = performance.now();

      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        
        if (elapsed >= duration) {
          localStorage.setItem(options.fastModeKey!, "true");
          setState(diffToResult(getRealDiff()));
          startNormal();
        } else {
          // Linear interpolation from oldDiff to realDiff
          const progress = elapsed / duration;
          const currentDiff = oldDiff - (extraDiff * progress);
          setState(diffToResult(currentDiff));
          animationFrameId = requestAnimationFrame(step);
        }
      };
      
      animationFrameId = requestAnimationFrame(step);
    } else {
      startNormal();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [targetTime]); // Using targetTime instead of targetDate to avoid object reference issues

  return state;
}
