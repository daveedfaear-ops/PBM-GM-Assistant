import React from 'react';
import { LogEntry } from '../types';

interface DebugLogViewProps {
  logs: LogEntry[];
  onClose: () => void;
  onClear: () => void;
}

const getLogLevelColor = (level: string) => {
  switch (level) {
    case 'ERROR': return 'text-red-400';
    case 'WARN': return 'text-yellow-400';
    default: return 'text-gray-400';
  }
};

const DebugLogView: React.FC<DebugLogViewProps> = ({ logs, onClose, onClear }) => {
  const handleDownload = () => {
    const logText = logs.map(entry =>
        `[${entry.timestamp}] [${entry.level}] ${entry.message}` +
        (entry.data ? `\nData: ${JSON.stringify(entry.data, null, 2)}` : '')
    ).join('\n\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pbm-gm-assistant_log_${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col border border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-indigo-400">Debug Log</h2>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              Download Log
            </button>
            <button
              onClick={onClear}
              className="px-3 py-1 text-sm rounded-lg bg-yellow-700 hover:bg-yellow-600 transition-colors"
            >
              Clear Log
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 text-sm rounded-lg bg-red-700 hover:bg-red-600 transition-colors"
            >
              Close
            </button>
          </div>
        </header>
        <main className="p-4 overflow-y-auto flex-grow bg-gray-950/50">
          <div className="font-mono text-xs space-y-3">
            {logs.map((entry, index) => (
              <div key={index} className="whitespace-pre-wrap break-words">
                <span className={getLogLevelColor(entry.level)}>
                  [{entry.timestamp}] [{entry.level}]
                </span>
                <span className="text-gray-200 ml-2">{entry.message}</span>
                {entry.data && (
                  <pre className="mt-1 p-2 bg-black/30 rounded text-sky-300 overflow-x-auto">
                    {JSON.stringify(entry.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DebugLogView;
