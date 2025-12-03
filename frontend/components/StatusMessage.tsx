
import React from 'react';

interface StatusMessageProps {
  message: string;
  type: 'error' | 'info' | 'success';
}

const StatusMessage: React.FC<StatusMessageProps> = ({ message, type }) => {
  let bgColor = 'bg-blue-100 border-blue-500 text-blue-700';
  if (type === 'error') {
    bgColor = 'bg-red-100 border-red-400 text-red-700';
  } else if (type === 'success') {
    bgColor = 'bg-green-100 border-green-400 text-green-700';
  }

  return (
    <div className={`border-l-4 p-4 my-4 ${bgColor}`} role="alert">
      <p>{message}</p>
    </div>
  );
};

export default StatusMessage;
