
import React from 'react';

interface ControlSwitchProps {
  isToggled: boolean;
  onToggle: () => void;
}

const ControlSwitch: React.FC<ControlSwitchProps> = ({ isToggled, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex items-center h-16 w-36 rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50 ${
        isToggled ? 'bg-soft-green focus:ring-soft-green' : 'bg-gray-300 focus:ring-gray-400'
      }`}
      aria-pressed={isToggled}
    >
      <span className="sr-only">Toggle Feeding Timer</span>
      <span
        className={`inline-block w-14 h-14 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
          isToggled ? 'translate-x-[82px]' : 'translate-x-1'
        }`}
      />
       <span className={`absolute font-bold text-white transition-opacity duration-200 ${isToggled ? 'opacity-100 left-6' : 'opacity-0'}`}>
        ON
      </span>
      <span className={`absolute font-bold text-gray-500 transition-opacity duration-200 ${!isToggled ? 'opacity-100 right-5' : 'opacity-0'}`}>
        OFF
      </span>
    </button>
  );
};

export default ControlSwitch;
