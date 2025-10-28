import React, { useState, useCallback } from 'react';
import { Player, Turn, GameWorld } from '../types';
import { generateTurnResponse } from '../services/geminiService';
import D20Icon from './icons/D20Icon';

interface PlayerDetailViewProps {
  player: Player;
  gameState: GameWorld;
  onUpdatePlayer: (player: Player) => void;
  onGoBack: () => void;
}

// A simple component to render the AI's response, highlighting special tags
const TurnResponse: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\[.*?\])/g);

  return (
    <p>
      {parts.map((part, i) => {
        if (part.startsWith('[ROLL:')) {
          return <strong key={i} className="text-yellow-400 bg-yellow-900/50 px-1 rounded">{part}</strong>;
        }
        if (part.startsWith('[UPDATE:')) {
          return <strong key={i} className="text-red-400 bg-red-900/50 px-1 rounded">{part}</strong>;
        }
        return part;
      })}
    </p>
  );
};

const PlayerDetailView: React.FC<PlayerDetailViewProps> = ({ player, gameState, onUpdatePlayer, onGoBack }) => {
  const [characterSheet, setCharacterSheet] = useState(player.characterSheet);
  const [currentAction, setCurrentAction] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateSheet = () => {
    onUpdatePlayer({ ...player, characterSheet });
  };

  const handleProcessTurn = useCallback(async () => {
    if (!currentAction.trim()) return;

    setIsLoading(true);
    try {
      const response = await generateTurnResponse(gameState, characterSheet, currentAction);
      const newTurn: Turn = {
        id: `turn-${Date.now()}`,
        action: currentAction,
        response,
        timestamp: new Date().toISOString(),
      };
      onUpdatePlayer({ ...player, characterSheet, turnHistory: [newTurn, ...player.turnHistory] });
      setCurrentAction('');
    } catch (error) {
      console.error('Failed to process turn:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentAction, gameState, characterSheet, player, onUpdatePlayer]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <button onClick={onGoBack} className="text-indigo-400 hover:text-indigo-300 mb-4">&larr; Back to All Players</button>
        <h2 className="text-3xl font-bold text-indigo-400">{player.name}</h2>
      </div>

      <section>
        <h3 className="text-xl font-semibold mb-2">Character Sheet</h3>
        <textarea
          value={characterSheet}
          onChange={(e) => setCharacterSheet(e.target.value)}
          onBlur={handleUpdateSheet}
          className="w-full h-48 p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y"
          placeholder="Enter character stats, inventory, notes..."
        />
      </section>

      <section className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
        <h3 className="text-xl font-semibold mb-2">Process Turn</h3>
        <textarea
          value={currentAction}
          onChange={(e) => setCurrentAction(e.target.value)}
          className="w-full h-24 p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y"
          placeholder={`What does ${player.name} do?`}
        />
        <button
          onClick={handleProcessTurn}
          disabled={isLoading}
          className="mt-2 w-full flex justify-center items-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <D20Icon className="h-5 w-5 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Response with AI'
          )}
        </button>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-4">Turn History</h3>
        <div className="space-y-6">
          {player.turnHistory.length === 0 ? (
            <p className="text-gray-500">No turns have been processed for this player yet.</p>
          ) : (
            player.turnHistory.map(turn => (
              <div key={turn.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <p className="text-gray-400 font-mono text-sm mb-2">
                  <span className="font-bold text-indigo-400">ACTION:</span> {turn.action}
                </p>
                <div className="border-t border-gray-700 pt-3 mt-3 text-gray-300 whitespace-pre-wrap prose prose-invert prose-sm max-w-none">
                  <TurnResponse text={turn.response} />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default PlayerDetailView;
