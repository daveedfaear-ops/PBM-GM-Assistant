
import React, { useState } from 'react';
import { Player } from '../types';
import PlayerCard from './PlayerCard';

interface PlayersViewProps {
  players: Player[];
  onAddPlayer: (name: string) => void;
  onSelectPlayer: (id: string) => void;
}

const PlayersView: React.FC<PlayersViewProps> = ({ players, onAddPlayer, onSelectPlayer }) => {
  const [newPlayerName, setNewPlayerName] = useState('');

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlayerName.trim()) {
      onAddPlayer(newPlayerName.trim());
      setNewPlayerName('');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-3xl font-bold text-indigo-400">Players</h2>
      
      <form onSubmit={handleAddPlayer} className="flex gap-2">
        <input
          type="text"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          placeholder="New Player Name"
          className="flex-grow bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 transition-colors">
          Add Player
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map(player => (
          <PlayerCard key={player.id} player={player} onClick={() => onSelectPlayer(player.id)} />
        ))}
      </div>
    </div>
  );
};

export default PlayersView;
