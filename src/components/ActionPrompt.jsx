import React from 'react';

function ActionPrompt({ text, className }) {
  return (
    <p className={`font-mono text-sm text-gray-500 ${className}`}>
      {text}
    </p>
  );
}

export default ActionPrompt;
