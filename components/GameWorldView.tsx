import React, { useState } from 'react';
import { GameWorld, NPC, Location, Quest } from '../types';
import { generateAdventureHooks } from '../services/geminiService';
import D20Icon from './icons/D20Icon';

interface GameWorldViewProps {
  gameWorld: GameWorld;
  onGameWorldChange: (newState: GameWorld) => void;
}

type Tab = 'Lore' | 'NPCs' | 'Locations' | 'Quests' | 'Hooks';

const GameWorldView: React.FC<GameWorldViewProps> = ({ gameWorld, onGameWorldChange }) => {
  const [activeTab, setActiveTab] = useState<Tab>('Lore');
  const [hooks, setHooks] = useState<string[]>([]);
  const [isLoadingHooks, setIsLoadingHooks] = useState(false);

  const handleGenerateHooks = async () => {
    setIsLoadingHooks(true);
    const generatedHooks = await generateAdventureHooks(gameWorld);
    setHooks(generatedHooks);
    setIsLoadingHooks(false);
  };

  const handleUpdate = <T extends keyof GameWorld>(field: T, value: GameWorld[T]) => {
    onGameWorldChange({ ...gameWorld, [field]: value });
  };
  
  const renderTabContent = () => {
    switch(activeTab) {
      case 'Lore':
        return (
          <>
            <p className="text-gray-400 mb-4">
              This is the global state of your game world. The AI will use this information as context for all player actions. Keep it updated with major plot points, world-changing events, and general tone.
            </p>
            <textarea
              value={gameWorld.lore}
              onChange={(e) => handleUpdate('lore', e.target.value)}
              className="w-full h-[60vh] p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y text-gray-200"
              placeholder="Describe your world..."
            />
          </>
        );
      // A generic entity manager component would be better, but this is fine for now
      case 'NPCs':
        return <EntityEditor type="NPC" items={gameWorld.npcs} onUpdate={(newNPCs) => handleUpdate('npcs', newNPCs as NPC[])} />;
      case 'Locations':
        return <EntityEditor type="Location" items={gameWorld.locations} onUpdate={(newLocs) => handleUpdate('locations', newLocs as Location[])} />;
      case 'Quests':
        return <EntityEditor type="Quest" items={gameWorld.quests} onUpdate={(newQuests) => handleUpdate('quests', newQuests as Quest[])} />;
      case 'Hooks':
         return (
          <div>
            <p className="text-gray-400 mb-4">
              Generate dynamic adventure hooks based on your current world state. Use these as inspiration for new quests and encounters.
            </p>
            <button
              onClick={handleGenerateHooks}
              disabled={isLoadingHooks}
              className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isLoadingHooks ? (
                <>
                  <D20Icon className="h-5 w-5 animate-spin" />
                  Generating Hooks...
                </>
              ) : (
                'Generate New Adventure Hooks'
              )}
            </button>
            <div className="mt-6 space-y-4">
              {hooks.map((hook, index) => (
                <div key={index} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <p className="text-gray-300">{hook}</p>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  const tabs: Tab[] = ['Lore', 'NPCs', 'Locations', 'Quests', 'Hooks'];

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-3xl font-bold text-indigo-400">Game World</h2>
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-4">{renderTabContent()}</div>
    </div>
  );
};

// Generic component for editing lists of entities (NPCs, Locations, etc.)
const EntityEditor = <T extends { id: string; name?: string; title?: string; description: string; status?: 'Active' | 'Inactive' | 'Completed' }>({ type, items, onUpdate }: { type: string; items: T[]; onUpdate: (items: T[]) => void }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemDesc.trim()) return;

    const newItem = {
      id: `${type.toLowerCase()}-${Date.now()}`,
      description: newItemDesc,
    };
    
    if ('name' in (items[0] || {})) {
       (newItem as any).name = newItemName;
    } else if ('title' in (items[0] || {})) {
       (newItem as any).title = newItemName;
       (newItem as any).status = 'Active';
    }


    onUpdate([...items, newItem as T]);
    setNewItemName('');
    setNewItemDesc('');
  };

  const handleUpdateItem = (id: string, field: keyof T, value: string) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    onUpdate(updatedItems);
  };
  
  const handleDeleteItem = (id: string) => {
    onUpdate(items.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddItem} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-2">
        <h3 className="text-lg font-semibold">Add New {type}</h3>
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder={type === 'Quest' ? 'Quest Title' : `${type} Name`}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
        <textarea
          value={newItemDesc}
          onChange={(e) => setNewItemDesc(e.target.value)}
          placeholder="Description"
          className="w-full h-24 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y"
        />
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 transition-colors w-full">
          Add {type}
        </button>
      </form>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="bg-gray-800 p-3 rounded-lg border border-gray-700">
            <input
              type="text"
              value={item.name || item.title}
              onChange={(e) => handleUpdateItem(item.id, (item.name ? 'name' : 'title') as keyof T, e.target.value)}
              className="text-lg font-bold bg-transparent focus:outline-none focus:bg-gray-700 rounded px-1 w-full text-indigo-400"
            />
             {type === 'Quest' && 'status' in item && (
                <select
                    value={item.status}
                    onChange={(e) => handleUpdateItem(item.id, 'status' as keyof T, e.target.value)}
                    className="bg-gray-700 text-xs rounded px-2 py-1 my-2 focus:outline-none"
                >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Completed">Completed</option>
                </select>
            )}
            <textarea
              value={item.description}
              onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
              className="w-full text-sm bg-transparent focus:outline-none focus:bg-gray-700 rounded px-1 mt-1 text-gray-400 resize-y"
              rows={2}
            />
            <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-400 text-xs mt-2">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};


export default GameWorldView;
