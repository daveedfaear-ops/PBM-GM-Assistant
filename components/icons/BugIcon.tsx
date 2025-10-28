import React from 'react';

const BugIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 20h-4a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4" />
    <path d="m18 16 4-4" />
    <path d="m18 12 4 4" />
    <path d="M12 14v-4" />
    <path d="M12 8h.01" />
  </svg>
);

export default BugIcon;
