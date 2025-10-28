import React from 'react';
import { Game } from '../types';
import PlusIcon from './icons/PlusIcon';

interface WorldSwitcherProps {
  games: Game[];
  activeGameId: string | null;
  onSwitchGame: (gameId: string) => void;
  onCreateNewGame: () => void;
}

const WorldSwitcher: React.FC<WorldSwitcherProps> = ({
  games,
  activeGameId,
  onSwitchGame,
  onCreateNewGame,
}) => {
  const activeGame = games.find(g => g.id === activeGameId);

  return (
    <div className="space-y-2">
      <div className="relative">
        <select
          value={activeGameId || ''}
          onChange={(e) => onSwitchGame(e.target.value)}
          disabled={!activeGameId}
          className="w-full appearance-none bg-gray-800 border border-gray-700 text-white py-2 pl-3 pr-10 rounded-lg leading-tight focus:outline-none focus:bg-gray-700 focus:border-indigo-500 text-sm truncate hidden md:block"
        >
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden md:flex items-center px-2 text-gray-400">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
        
        {/* Mobile / Collapsed view */}
        <div className="md:hidden text-center text-indigo-400 font-semibold p-2 bg-gray-800 rounded-lg truncate">
            {activeGame?.name || 'No World'}
        </div>
      </div>
      <button
        onClick={onCreateNewGame}
        className="w-full flex items-center justify-center md:justify-start gap-2 bg-indigo-600/20 text-indigo-300 px-3 py-2 rounded-lg hover:bg-indigo-600/40 transition-colors text-sm"
      >
        <PlusIcon className="h-5 w-5" />
        <span className="hidden md:block">New World</span>
      </button>
    </div>
  );
};

export default WorldSwitcher;
