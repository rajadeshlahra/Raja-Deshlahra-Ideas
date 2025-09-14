
import React from 'react';

interface TimerDisplayProps {
  seconds: number;
  size?: 'normal' | 'large';
}

const formatTime = (totalSeconds: number): string => {
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    return "00:00:00";
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number) => num.toString().padStart(2, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const TimerDisplay: React.FC<TimerDisplayProps> = ({ seconds, size = 'normal' }) => {
  const time = formatTime(seconds);
  const textSize = size === 'large' ? 'text-5xl sm:text-6xl' : 'text-lg';

  return (
    <div className={`font-mono tracking-wider ${textSize}`}>
      {time}
    </div>
  );
};

export default TimerDisplay;
