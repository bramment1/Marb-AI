import React from 'react';

const StatusBar: React.FC = () => {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gray-800 p-1 text-center text-xs text-gray-100">
      Offline • Binary-aware diffs: on
    </div>
  );
};

export default StatusBar;
