import React, { useState } from 'react';
import { GameWorld, NPC, Location, Quest } from '../types';
import { generateAdventureHooks, generateNPCs, generateLocations, generateQuests, generateNpcImage } from '../services/geminiService';
import D20Icon from './icons/D20Icon';
import ImageIcon from './icons/ImageIcon';

interface GameWorldViewProps {
  gameWorld: GameWorld;
  onGameWorldChange: (newState: GameWorld) => void;
}

type Tab = 'Lore' | 'NPCs' | 'Locations' | 'Quests' | 'Hooks';

// Component for managing NPCs by location
const NPCEditor = ({ gameWorld, onUpdate }: { gameWorld: GameWorld; onUpdate: (npcs: NPC[]) => void }) => {
    const [selectedLocationId, setSelectedLocationId] = useState<string | 'unassigned'>('unassigned');
    const [newItemName, setNewItemName] = useState('');
    const [newItemDesc, setNewItemDesc] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim() || !newItemDesc.trim()) return;

        const newNPC: NPC = {
            id: `npc-${Date.now()}`,
            name: newItemName,
            description: newItemDesc,
            locationId: selectedLocationId === 'unassigned' ? null : selectedLocationId,
        };

        onUpdate([...gameWorld.npcs, newNPC]);
        setNewItemName('');
        setNewItemDesc('');
    };

    const handleUpdateItem = (id: string, field: keyof NPC, value: string | null) => {
        const updatedItems = gameWorld.npcs.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        );
        onUpdate(updatedItems);
    };

    const handleDeleteItem = (id: string) => {
        onUpdate(gameWorld.npcs.filter(item => item.id !== id));
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const newNpcData = await generateNPCs(gameWorld);
            const newNpcs: NPC[] = newNpcData.map((data, i) => ({
                ...data,
                id: `npc-${Date.now()}-${i}`,
                locationId: selectedLocationId === 'unassigned' ? null : selectedLocationId,
            }));
            onUpdate([...gameWorld.npcs, ...newNpcs]);
        } catch (error) {
            console.error("Failed to generate NPCs:", error);
            alert("An error occurred while trying to generate NPCs.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateImage = async (npc: NPC) => {
        if (generatingImageId) return;
        setGeneratingImageId(npc.id);
        try {
            const imageUrl = await generateNpcImage(npc);
            handleUpdateItem(npc.id, 'image', imageUrl);
        } catch (error) {
            console.error("Failed to generate NPC image:", error);
            alert("An error occurred while trying to generate the portrait.");
        } finally {
            setGeneratingImageId(null);
        }
    };

    const filteredNPCs = gameWorld.npcs.filter(npc => {
        if (selectedLocationId === 'unassigned') {
            return !npc.locationId;
        }
        return npc.locationId === selectedLocationId;
    });

    return (
        <div className="space-y-4">
            {/* Location Selector Dropdown */}
            <div className="mb-4">
                <label htmlFor="location-select" className="block text-sm font-medium text-gray-400 mb-1">
                    Show NPCs At Location
                </label>
                <select
                    id="location-select"
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                    <option value="unassigned">Unassigned</option>
                    {gameWorld.locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                </select>
            </div>

            {/* Add NPC Form */}
            <form onSubmit={handleAddItem} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-2">
                 <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold">Add New NPC to {selectedLocationId === 'unassigned' ? 'Unassigned' : gameWorld.locations.find(l => l.id === selectedLocationId)?.name}</h3>
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex items-center gap-2 text-sm bg-indigo-600/50 text-indigo-300 px-3 py-1 rounded-md hover:bg-indigo-600/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Generate new NPCs with AI"
                    >
                        <D20Icon className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                        <span>Generate</span>
                    </button>
                </div>
                <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="NPC Name"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <textarea
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    placeholder="Description"
                    className="w-full h-24 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y"
                />
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 transition-colors w-full">
                    Add NPC
                </button>
            </form>

            {/* NPC List */}
            <div className="space-y-3">
                {filteredNPCs.length > 0 ? filteredNPCs.map(item => {
                    const isGeneratingThisImage = generatingImageId === item.id;
                    return (
                       <div key={item.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col md:flex-row gap-4">
                           <div className="w-full md:w-32 h-32 bg-gray-900 rounded flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                               {item.image && !isGeneratingThisImage && (
                                   <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                               )}
                               {!item.image && !isGeneratingThisImage && (
                                   <ImageIcon className="w-12 h-12 text-gray-600" />
                               )}
                               {isGeneratingThisImage && (
                                   <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                       <D20Icon className="w-8 h-8 text-indigo-400 animate-spin" />
                                   </div>
                               )}
                           </div>
                           <div className="flex-grow">
                               <input
                                   type="text"
                                   value={item.name}
                                   onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                                   className="text-lg font-bold bg-transparent focus:outline-none focus:bg-gray-700 rounded px-1 w-full text-indigo-400"
                               />
                               <textarea
                                   value={item.description}
                                   onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                                   className="w-full text-sm bg-transparent focus:outline-none focus:bg-gray-700 rounded px-1 mt-1 text-gray-400 resize-y"
                                   rows={3}
                               />
                               <div className="flex justify-between items-center mt-2 flex-wrap gap-2">
                                   <select
                                       value={item.locationId || 'unassigned'}
                                       onChange={(e) => handleUpdateItem(item.id, 'locationId', e.target.value === 'unassigned' ? null : e.target.value)}
                                       className="bg-gray-700 text-xs rounded px-2 py-1 focus:outline-none text-gray-300"
                                       title="Move NPC to another location"
                                   >
                                       <option value="unassigned">Unassigned</option>
                                       {gameWorld.locations.map(loc => (
                                           <option key={loc.id} value={loc.id}>{loc.name}</option>
                                       ))}
                                   </select>
                                   <div className="flex items-center gap-2">
                                        <button 
                                           onClick={() => handleGenerateImage(item)}
                                           disabled={isGeneratingThisImage || !!generatingImageId}
                                           className="flex items-center gap-1 text-xs bg-teal-600/50 text-teal-300 px-2 py-1 rounded-md hover:bg-teal-600/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                           title="Generate portrait with AI"
                                       >
                                           <ImageIcon className={`h-3 w-3 ${isGeneratingThisImage ? 'animate-pulse' : ''}`} />
                                           <span>{isGeneratingThisImage ? 'Generating...' : 'Gen. Portrait'}</span>
                                       </button>
                                       <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-400 text-xs">Delete</button>
                                   </div>
                               </div>
                           </div>
                       </div>
                    )
                }) : (
                    <div className="text-center py-6">
                        <p className="text-gray-500">No NPCs in this location.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

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
      case 'NPCs':
        return <NPCEditor gameWorld={gameWorld} onUpdate={(newNPCs) => handleUpdate('npcs', newNPCs)} />;
      case 'Locations':
        return <EntityEditor type="Location" gameWorld={gameWorld} items={gameWorld.locations} onUpdate={(newLocs) => handleUpdate('locations', newLocs as Location[])} />;
      case 'Quests':
        return <EntityEditor type="Quest" gameWorld={gameWorld} items={gameWorld.quests} onUpdate={(newQuests) => handleUpdate('quests', newQuests as Quest[])} />;
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

// Generic component for editing lists of entities (Locations, etc.)
const EntityEditor = <T extends { id: string; name?: string; title?: string; description: string; status?: 'Active' | 'Inactive' | 'Completed' }>({ type, items, onUpdate, gameWorld }: { type: string; items: T[]; onUpdate: (items: T[]) => void, gameWorld: GameWorld }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
        let newItemsData;
        if (type === 'Location') {
            newItemsData = await generateLocations(gameWorld);
        } else if (type === 'Quest') {
            newItemsData = await generateQuests(gameWorld);
        }

        if (newItemsData && newItemsData.length > 0) {
            const newItems = (newItemsData as any[]).map((data, i) => {
                const baseItem = {
                    id: `${type.toLowerCase()}-${Date.now()}-${i}`,
                    description: data.description,
                };
                if ('name' in data) {
                    return { ...baseItem, name: data.name };
                }
                if ('title' in data) {
                    return { ...baseItem, title: data.title, status: 'Active' };
                }
                return baseItem;
            });
            onUpdate([...items, ...newItems as T[]]);
        }
    } catch (error) {
        console.error(`Failed to generate ${type}s:`, error);
        alert(`An error occurred while trying to generate ${type}s.`);
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddItem} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-2">
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Add New {type}</h3>
            <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 text-sm bg-indigo-600/50 text-indigo-300 px-3 py-1 rounded-md hover:bg-indigo-600/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={`Generate new ${type}s with AI`}
            >
                <D20Icon className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>Generate</span>
            </button>
        </div>
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