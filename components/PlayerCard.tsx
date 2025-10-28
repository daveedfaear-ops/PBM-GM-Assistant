
import React from 'react';
import { Player } from '../types';

interface PlayerCardProps {
  player: Player;
  onClick: () => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-gray-800 p-4 rounded-lg text-left w-full border border-gray-700 hover:border-indigo-500 hover:bg-gray-700/50 transition-all transform hover:scale-[1.02]"
    >
      <h3 className="text-xl font-bold text-indigo-400">{player.name}</h3>
      <p className="text-gray-400 mt-2 text-sm line-clamp-3 whitespace-pre-wrap">
        {player.characterSheet}
      </p>
    </button>
  );
};

export default PlayerCard;
