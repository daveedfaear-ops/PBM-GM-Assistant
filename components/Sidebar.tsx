import React from 'react';
import { View, Game } from '../types';
import D20Icon from './icons/D20Icon';
import WorldIcon from './icons/WorldIcon';
import UsersIcon from './icons/UsersIcon';
import WorldSwitcher from './WorldSwitcher';
import DownloadIcon from './icons/DownloadIcon';
import UploadIcon from './icons/UploadIcon';

interface SidebarProps {
  activeView: View;
  setView: (view: View) => void;
  games: Game[];
  activeGameId: string | null;
  onSwitchGame: (gameId: string) => void;
  onCreateNewGame: () => void;
  onDownloadState: () => void;
  onLoadState: (file: File) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  setView,
  games,
  activeGameId,
  onSwitchGame,
  onCreateNewGame,
  onDownloadState,
  onLoadState,
}) => {
  const navItems = [
    { view: View.Players, label: 'Players', icon: UsersIcon },
    { view: View.GameWorld, label: 'Game World', icon: WorldIcon },
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onLoadState(file);
    }
    // Reset file input to allow loading the same file again
    event.target.value = '';
  };

  return (
    <nav className="w-16 md:w-64 bg-gray-950 p-2 md:p-4 flex flex-col border-r border-gray-800">
      <div className="flex items-center gap-3 mb-4 px-2">
        <D20Icon className="h-8 w-8 text-indigo-400 flex-shrink-0" />
        <h1 className="text-xl font-bold hidden md:block">GM Assistant</h1>
      </div>
      
      <WorldSwitcher
        games={games}
        activeGameId={activeGameId}
        onSwitchGame={onSwitchGame}
        onCreateNewGame={onCreateNewGame}
      />
      
      <ul className="space-y-2 mt-4">
        {navItems.map(item => {
          const isActive = activeView === item.view;
          return (
            <li key={item.view}>
              <button
                onClick={() => setView(item.view)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-500 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon className="h-6 w-6 flex-shrink-0" />
                <span className="hidden md:block">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto pt-4 border-t border-gray-800 space-y-2">
         <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:block">Session</h3>
         <button
            onClick={onDownloadState}
            className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-gray-400 hover:bg-gray-800 hover:text-white"
        >
            <DownloadIcon className="h-6 w-6 flex-shrink-0" />
            <span className="hidden md:block">Download Session</span>
        </button>
        <label
            htmlFor="session-upload"
            className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-gray-400 hover:bg-gray-800 hover:text-white cursor-pointer"
        >
            <UploadIcon className="h-6 w-6 flex-shrink-0" />
            <span className="hidden md:block">Load Session</span>
        </label>
        <input
            type="file"
            id="session-upload"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
        />
      </div>
    </nav>
  );
};

export default Sidebar;