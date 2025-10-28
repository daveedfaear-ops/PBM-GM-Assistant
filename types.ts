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


export enum View {
  GameWorld = 'GAME_WORLD',
  Players = 'PLAYERS',
}
