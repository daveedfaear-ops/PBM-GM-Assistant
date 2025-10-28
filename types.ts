export interface Turn {
  id: string;
  action: string;
  response: string;
  timestamp: string;
}

export interface Player {
  id:string;
  name: string;
  characterSheet: string;
  turnHistory: Turn[];
}

export interface NPC {
  id: string;
  name: string;
  description: string;
  locationId?: string | null;
  image?: string;
}

export interface Location {
  id: string;
  name: string;
  description: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: 'Active' | 'Inactive' | 'Completed';
}

export interface GameWorld {
  lore: string;
  npcs: NPC[];
  locations: Location[];
  quests: Quest[];
}

export interface Game {
  id: string;
  name: string;
  gameWorld: GameWorld;
  players: Player[];
}

export interface AppState {
  games: Game[];
  activeGameId: string | null;
}

export enum View {
  GameWorld = 'GAME_WORLD',
  Players = 'PLAYERS',
}

// Data shapes for AI generation responses
export interface NewNPCData {
    name: string;
    description: string;
}

export interface NewLocationData {
    name: string;
    description: string;
}

export interface NewQuestData {
    title: string;
    description: string;
}