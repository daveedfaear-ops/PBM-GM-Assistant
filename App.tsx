import React, { useState, useCallback } from 'react';
import { Player, View, GameWorld, NPC, Location, Quest } from './types';
import Sidebar from './components/Sidebar';
import GameWorldView from './components/GameWorldView';
import PlayersView from './components/PlayersView';
import PlayerDetailView from './components/PlayerDetailView';

const INITIAL_GAME_WORLD: GameWorld = {
  lore: `The world of Aerthos is recovering from the Sundering, a magical cataclysm that shattered the continents a century ago. The central kingdom of Eldoria is a beacon of stability, but its borders are threatened by the encroaching Gloomwood, a forest corrupted by dark magic. Small pockets of civilization, called 'Freeholds', dot the landscape, connected by treacherous trade routes. Magic is wild and unpredictable, and ancient ruins from before the Sundering are rumored to hold immense power and danger.

Current Major Plot Point: The players have just arrived in the Freehold of Oakhaven, a small town on the edge of the Gloomwood. They've heard rumors of a lost artifact, the Sunstone, which is said to be able to push back the forest's corruption.`,
  npcs: [
    { id: 'npc-1', name: 'Elara', description: 'The stoic mayor of Oakhaven and a former ranger. Knows the Gloomwood better than anyone.' },
    { id: 'npc-2', name: 'Balthazar', description: 'Oakhaven\'s eccentric and reclusive alchemist. May have knowledge of the Sunstone.' },
    { id: 'npc-3', name: 'Grak', description: 'The gruff but good-hearted blacksmith. A potential ally if his trust is earned.' },
  ],
  locations: [
    { id: 'loc-1', name: 'Oakhaven', description: 'A small Freehold on the edge of the Gloomwood. The starting location for the players.' },
    { id: 'loc-2', name: 'The Gloomwood', description: 'A vast, dark forest corrupted by wild magic. Dangerous, but holds many secrets.' },
    { id: 'loc-3', name: 'Eldoria', description: 'The central kingdom, a beacon of stability and civilization.' },
  ],
  quests: [
    { id: 'quest-1', title: 'The Sunstone', description: 'Find the lost artifact known as the Sunstone to push back the Gloomwood\'s corruption.', status: 'Active' },
  ],
};


const INITIAL_PLAYERS: Player[] = [
  {
    id: 'player-1',
    name: 'Valerius',
    characterSheet: `Class: Shadow Rogue
Race: Elf
Level: 3

Appearance: Tall and slender with silver hair and piercing grey eyes. Wears dark, supple leather armor.

Inventory:
- Set of masterwork lockpicks
- Shortsword +1
- Dagger of Venom
- 3 health potions
- 50 gold pieces

Skills: Stealth, Acrobatics, Deception

Backstory: An exile from a noble house, Valerius seeks to reclaim his honor by making a name for himself as an adventurer. He is secretive but loyal to his companions.`,
    turnHistory: [],
  },
];


const App: React.FC = () => {
  const [view, setView] = useState<View>(View.Players);
  const [gameWorld, setGameWorld] = useState<GameWorld>(INITIAL_GAME_WORLD);
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(players[0]?.id || null);

  const handleAddPlayer = useCallback((name: string) => {
    const newPlayer: Player = {
      id: `player-${Date.now()}`,
      name,
      characterSheet: `Class: \nRace: \n\nInventory:\n\nBackstory:`,
      turnHistory: [],
    };
    setPlayers(prev => [...prev, newPlayer]);
  }, []);
  
  const handleUpdatePlayer = useCallback((updatedPlayer: Player) => {
    setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
  }, []);

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-200">
      <Sidebar activeView={view} setView={setView} />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {view === View.GameWorld && (
            <GameWorldView gameWorld={gameWorld} onGameWorldChange={setGameWorld} />
          )}
          {view === View.Players && (
            !selectedPlayer ? (
              <PlayersView
                players={players}
                onAddPlayer={handleAddPlayer}
                onSelectPlayer={setSelectedPlayerId}
              />
            ) : (
              <PlayerDetailView
                key={selectedPlayer.id}
                player={selectedPlayer}
                gameState={gameWorld}
                onUpdatePlayer={handleUpdatePlayer}
                onGoBack={() => setSelectedPlayerId(null)}
              />
            )
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
