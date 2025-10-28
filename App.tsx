import React, { useState, useCallback, useEffect } from 'react';
import { Player, View, GameWorld, AppState, Game, LogEntry } from './types';
import Sidebar from './components/Sidebar';
import GameWorldView from './components/GameWorldView';
import PlayersView from './components/PlayersView';
import PlayerDetailView from './components/PlayerDetailView';
import CreateWorldModal from './components/CreateWorldModal';
import { generateLoreFromFiles } from './services/geminiService';
import * as logger from './services/loggerService';
import DebugLogView from './components/DebugLogView';

const STORAGE_KEY = 'PBM_GM_ASSISTANT_STATE';

const INITIAL_GAME_WORLD: GameWorld = {
  lore: `The world of Aerthos is recovering from the Sundering, a magical cataclysm that shattered the continents a century ago. The central kingdom of Eldoria is a beacon of stability, but its borders are threatened by the encroaching Gloomwood, a forest corrupted by dark magic. Small pockets of civilization, called 'Freeholds', dot the landscape, connected by treacherous trade routes. Magic is wild and unpredictable, and ancient ruins from before the Sundering are rumored to hold immense power and danger.

Current Major Plot Point: The players have just arrived in the Freehold of Oakhaven, a small town on the edge of the Gloomwood. They've heard rumors of a lost artifact, the Sunstone, which is said to be able to push back the forest's corruption.`,
  npcs: [
    { id: 'npc-1', name: 'Elara', description: 'The stoic mayor of Oakhaven and a former ranger. Knows the Gloomwood better than anyone.', locationId: 'loc-1' },
    { id: 'npc-2', name: 'Balthazar', description: 'Oakhaven\'s eccentric and reclusive alchemist. May have knowledge of the Sunstone.', locationId: 'loc-1' },
    { id: 'npc-3', name: 'Grak', description: 'The gruff but good-hearted blacksmith. A potential ally if his trust is earned.', locationId: 'loc-1' },
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
    characterSheet: `Class: Shadow Rogue\nRace: Elf\nLevel: 3\n\nAppearance: Tall and slender with silver hair and piercing grey eyes. Wears dark, supple leather armor.\n\nInventory:\n- Set of masterwork lockpicks\n- Shortsword +1\n- Dagger of Venom\n- 3 health potions\n- 50 gold pieces\n\nSkills: Stealth, Acrobatics, Deception\n\nBackstory: An exile from a noble house, Valerius seeks to reclaim his honor by making a name for himself as an adventurer. He is secretive but loyal to his companions.`,
    turnHistory: [],
  },
];

const getInitialState = (): AppState => {
  const defaultGameId = `game-${Date.now()}`;
  return {
    activeGameId: defaultGameId,
    games: [{
      id: defaultGameId,
      name: "Aerthos Campaign",
      players: INITIAL_PLAYERS,
      gameWorld: INITIAL_GAME_WORLD,
    }],
  };
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({ games: [], activeGameId: null });
  const [view, setView] = useState<View>(View.Players);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isCreateWorldModalOpen, setCreateWorldModalOpen] = useState(false);
  const [isLogVisible, setLogVisible] = useState(false);
  const [logEntries, setLogEntries] = useState<LogEntry[]>(logger.getLogs());


  useEffect(() => {
    logger.log("App initializing...");
    const handleLogUpdate = (updatedLogs: LogEntry[]) => setLogEntries([...updatedLogs]);
    logger.subscribe(handleLogUpdate);
    
    return () => logger.unsubscribe(handleLogUpdate);
  }, []);

  // Load state from localStorage on initial render
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setAppState(parsedState);
        logger.log("App state loaded from localStorage.", parsedState);
        // Ensure a player is selected if possible
        const activeGame = parsedState.games.find(g => g.id === parsedState.activeGameId);
        if (activeGame?.players.length > 0) {
          setSelectedPlayerId(activeGame.players[0].id);
        }
      } else {
        const initialState = getInitialState();
        setAppState(initialState);
        setSelectedPlayerId(initialState.games[0]?.players[0]?.id || null);
        logger.log("No saved state found, initialized with default state.", initialState);
      }
    } catch (error) {
      console.error("Failed to load or parse state from localStorage:", error);
      logger.log("Failed to load state from localStorage.", error, "ERROR");
      setAppState(getInitialState());
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (appState.activeGameId) { // Avoid saving the initial empty state
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    }
  }, [appState]);

  const activeGame = appState.games.find(g => g.id === appState.activeGameId);
  const players = activeGame?.players || [];
  const gameWorld = activeGame?.gameWorld;

  // Reset player selection when switching games
  useEffect(() => {
    setSelectedPlayerId(null);
  }, [appState.activeGameId]);

  const handleUpdateState = (updater: (prev: AppState) => AppState) => {
    setAppState(updater);
  };

  const handleAddPlayer = useCallback((name: string) => {
    handleUpdateState(prev => {
      if (!prev.activeGameId) return prev;
      const newPlayer: Player = {
        id: `player-${Date.now()}`,
        name,
        characterSheet: `Class: \nRace: \n\nInventory:\n\nBackstory:`,
        turnHistory: [],
      };
      const newState = {
        ...prev,
        games: prev.games.map(game =>
          game.id === prev.activeGameId
            ? { ...game, players: [...game.players, newPlayer] }
            : game
        ),
      };
      logger.log("Player added", newPlayer);
      return newState;
    });
  }, []);

  const handleUpdatePlayer = useCallback((updatedPlayer: Player) => {
    handleUpdateState(prev => {
      if (!prev.activeGameId) return prev;
      return {
        ...prev,
        games: prev.games.map(game =>
          game.id === prev.activeGameId
            ? { ...game, players: game.players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p) }
            : game
        ),
      };
    });
  }, []);
  
  const handleGameWorldChange = useCallback((newGameWorld: GameWorld) => {
     handleUpdateState(prev => {
      if (!prev.activeGameId) return prev;
      return {
        ...prev,
        games: prev.games.map(game =>
          game.id === prev.activeGameId
            ? { ...game, gameWorld: newGameWorld }
            : game
        ),
      };
    });
  }, []);

  const handleSwitchGame = (gameId: string) => {
    if (gameId === appState.activeGameId) return;
    logger.log(`Switched game from ${appState.activeGameId} to ${gameId}`);
    setAppState(prev => ({...prev, activeGameId: gameId }));
    setView(View.Players); // Default to players view on switch
  };

  const handleCreateNewGame = async (name: string, files: File[]) => {
    logger.log("Creating new game...", { name, fileCount: files.length });
    let newLore = 'A new world awaits...';
    if (files.length > 0) {
      newLore = await generateLoreFromFiles(files);
    }
    const newGameId = `game-${Date.now()}`;
    const newGame: Game = {
      id: newGameId,
      name,
      gameWorld: { ...INITIAL_GAME_WORLD, lore: newLore },
      players: [],
    };
    setAppState(prev => ({
      activeGameId: newGameId,
      games: [...prev.games, newGame],
    }));
    logger.log("New game created", newGame);
    setCreateWorldModalOpen(false);
    setView(View.Players);
  };

  const handleDownloadState = useCallback(() => {
    if (!appState.activeGameId) {
        alert("No active game to save.");
        return;
    }
    try {
        const stateJson = JSON.stringify(appState, null, 2);
        const blob = new Blob([stateJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const activeGameName = appState.games.find(g => g.id === appState.activeGameId)?.name || 'session';
        const safeFileName = activeGameName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.download = `pbm-gm-assistant_${safeFileName}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        logger.log("Session state downloaded.");
    } catch (error) {
        console.error("Failed to save session:", error);
        logger.log("Failed to download session state.", error, "ERROR");
        alert("An error occurred while trying to save the session.");
    }
  }, [appState]);

  const handleLoadState = useCallback((file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const result = event.target?.result;
            if (typeof result !== 'string') {
                throw new Error("Failed to read file content.");
            }
            const loadedState = JSON.parse(result);

            // Basic validation
            if (loadedState && Array.isArray(loadedState.games) && 'activeGameId' in loadedState) {
                setAppState(loadedState);
                setSelectedPlayerId(null); // Reset selection
                setView(View.Players); // Go to a default view
                logger.log("Session state loaded from file.", loadedState);
                alert("Session loaded successfully!");
            } else {
                throw new Error("Invalid session file format.");
            }
        } catch (error) {
            console.error("Failed to load session:", error);
            logger.log("Failed to load session state from file.", error, "ERROR");
            alert("Failed to load session. The file may be corrupt or in an invalid format.");
        }
    };
    reader.onerror = () => {
        console.error("Error reading file.");
        logger.log("Error reading session file.", null, "ERROR");
        alert("An error occurred while reading the file.");
    };
    reader.readAsText(file);
  }, []);

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-200">
      <Sidebar
        activeView={view}
        setView={setView}
        games={appState.games}
        activeGameId={appState.activeGameId}
        onSwitchGame={handleSwitchGame}
        onCreateNewGame={() => setCreateWorldModalOpen(true)}
        onDownloadState={handleDownloadState}
        onLoadState={handleLoadState}
        onToggleLogView={() => setLogVisible(v => !v)}
      />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {!activeGame && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-gray-400">No World Selected</h2>
              <p className="text-gray-500 mt-2">Create or select a world from the sidebar to begin.</p>
              <button
                onClick={() => setCreateWorldModalOpen(true)}
                className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-500 transition-colors"
              >
                Create Your First World
              </button>
            </div>
          )}
          {view === View.GameWorld && gameWorld && (
            <GameWorldView gameWorld={gameWorld} onGameWorldChange={handleGameWorldChange} />
          )}
          {view === View.Players && activeGame && (
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
                gameState={gameWorld!}
                onUpdatePlayer={handleUpdatePlayer}
                onGoBack={() => setSelectedPlayerId(null)}
              />
            )
          )}
        </div>
      </main>
      {isCreateWorldModalOpen && (
        <CreateWorldModal
          onClose={() => setCreateWorldModalOpen(false)}
          onCreate={handleCreateNewGame}
        />
      )}
       {isLogVisible && (
        <DebugLogView
          logs={logEntries}
          onClose={() => setLogVisible(false)}
          onClear={logger.clearLogs}
        />
      )}
    </div>
  );
};

export default App;