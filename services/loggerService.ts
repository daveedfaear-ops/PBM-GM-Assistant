import { LogEntry, LogLevel } from '../types';

const LOG_STORAGE_KEY = 'PBM_GM_ASSISTANT_LOGS';
const MAX_LOG_ENTRIES = 250; // A reasonable limit to prevent localStorage bloat.
let listeners: ((logs: LogEntry[]) => void)[] = [];

// Helper to notify all subscribed components of a log update.
const notifyListeners = (logs: LogEntry[]) => {
  for (const listener of listeners) {
    listener(logs);
  }
};

/**
 * Retrieves all log entries from localStorage.
 */
export const getLogs = (): LogEntry[] => {
  try {
    const storedLogs = localStorage.getItem(LOG_STORAGE_KEY);
    if (storedLogs) {
      return JSON.parse(storedLogs);
    }
    return [];
  } catch (error) {
    console.error("Failed to read or parse logs from localStorage:", error);
    // If storage is corrupt, clear it to prevent repeated errors on load.
    localStorage.removeItem(LOG_STORAGE_KEY);
    return [];
  }
};

/**
 * Adds a new log entry, saves it to localStorage, and notifies listeners.
 */
export const log = (message: string, data?: any, level: LogLevel = 'INFO') => {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data: data ? JSON.parse(JSON.stringify(data)) : undefined, // Deep copy to break refs
  };

  const currentLogs = getLogs();
  currentLogs.push(entry);

  // Trim logs to prevent localStorage from growing indefinitely.
  const trimmedLogs = currentLogs.length > MAX_LOG_ENTRIES 
    ? currentLogs.slice(currentLogs.length - MAX_LOG_ENTRIES) 
    : currentLogs;

  try {
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(trimmedLogs));
  } catch (error) {
    // This can happen if localStorage is full. Log to console but don't crash the app.
    console.error("Failed to write logs to localStorage:", error);
  }

  // Also log to the console for real-time dev feedback
  console.log(`[${level}] ${message}`, data || '');

  notifyListeners(trimmedLogs);
};

export const subscribe = (listener: (logs: LogEntry[]) => void) => {
  listeners.push(listener);
};

export const unsubscribe = (listener: (logs: LogEntry[]) => void) => {
  listeners = listeners.filter(l => l !== listener);
};

/**
 * Clears all logs from localStorage and re-initializes with a "cleared" message.
 */
export const clearLogs = () => {
  localStorage.removeItem(LOG_STORAGE_KEY);
  // 'log' will now read an empty array from storage, add the message,
  // save the new single-entry array, and notify listeners.
  // This correctly replicates the old behavior but with persistence.
  log('Logs cleared.');
};
