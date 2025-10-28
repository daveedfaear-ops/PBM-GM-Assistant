
import React from 'react';

const D20Icon: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M12 2l10 10-10 10L2 12 12 2z" />
    <path d="M2 12l5 5-5 5" />
    <path d="M22 12l-5 5 5 5" />
    <path d="M12 2v10l5 5" />
    <path d="M12 2v10l-5 5" />
    <path d="M12 22v-10" />
  </svg>
);

export default D20Icon;
