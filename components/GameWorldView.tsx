import React, { useState } from 'react';
import { GameWorld, NPC, Location, Quest } from '../types';
import { generateAdventureHooks, generateNPCs, generateLocations, generateQuests, generateNpcImage } from '../services/geminiService';
import D20Icon from './icons/D20Icon';
import ImageIcon from './icons/ImageIcon';
import { log } from '../services/loggerService';
import DownloadIcon from './icons/DownloadIcon';
import UploadIcon from './icons/UploadIcon';
import { blobToBase64 } from '../utils/imageUtils';

interface GameWorldViewProps {
  gameWorld: GameWorld;
  onGameWorldChange: (newState: GameWorld) => void;
}

type Tab = 'Lore' | 'NPCs' | 'Locations' | 'Quests' | 'Hooks';

// Component for managing NPCs by location
const NPCEditor = ({ gameWorld, onUpdate }: { gameWorld: GameWorld; onUpdate: (npcs: NPC[]) => void }) => {
    const [selectedLocationId, setSelectedLocationId] = useState<string | 'all' | 'unassigned'>('all');
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
            locationId: (selectedLocationId === 'unassigned' || selectedLocationId === 'all') ? null : selectedLocationId,
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
                locationId: (selectedLocationId === 'unassigned' || selectedLocationId === 'all') ? null : selectedLocationId,
            }));
            onUpdate([...gameWorld.npcs, ...newNpcs]);
        } catch (error) {
            console.error("Failed to generate NPCs:", error);
            alert("An error occurred while trying to generate NPCs.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleUploadNpcs = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        log("Starting NPC upload from JSON files", { fileCount: files.length });

        const readFile = (file: File): Promise<Partial<NPC>[]> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const content = JSON.parse(reader.result as string);
                        // Handle both single object and array of objects
                        const potentialNpcs = Array.isArray(content) ? content : [content];
                        
                        const validNpcs = potentialNpcs.filter(item => 
                            item && typeof item.name === 'string' && typeof item.description === 'string'
                        );

                        resolve(validNpcs);
                    } catch (error) {
                        const errorMessage = `Could not parse ${file.name}. Is it a valid NPC JSON file?`;
                        log(errorMessage, error, 'ERROR');
                        reject(new Error(errorMessage));
                    }
                };
                reader.onerror = (error) => {
                    const errorMessage = `Error reading file ${file.name}`;
                    log(errorMessage, error, 'ERROR');
                    reject(new Error(errorMessage));
                };
                reader.readAsText(file);
            });
        };

        try {
            const results = await Promise.allSettled(Array.from(files).map(readFile));
            
            const allUploadedNpcs = results
                .filter(result => result.status === 'fulfilled')
                .map(result => (result as PromiseFulfilledResult<Partial<NPC>[]>).value)
                .flat();

            const failedFiles = results
                .filter(result => result.status === 'rejected')
                .map(result => (result as PromiseRejectedResult).reason.message)
                .join('\n');
                
            if (failedFiles) {
                alert(`Some files could not be processed:\n${failedFiles}`);
            }

            if (allUploadedNpcs.length > 0) {
                const currentLocationId = (selectedLocationId === 'unassigned' || selectedLocationId === 'all') ? null : selectedLocationId;
                
                const uploadedNpcNames = new Set(allUploadedNpcs.map(npc => npc.name!).filter(Boolean));

                const newNpcs: NPC[] = allUploadedNpcs.map((npcData, i) => ({
                    id: `npc-${Date.now()}-${i}`,
                    name: npcData.name!,
                    description: npcData.description!,
                    locationId: currentLocationId,
                    image: npcData.image, // Keep image if it exists
                }));

                const existingNpcsToKeep = gameWorld.npcs.filter(npc => {
                    // Determine if the NPC is in the target location for upload
                    const isInCurrentLocation = (currentLocationId === null)
                        ? !npc.locationId // Target is 'Unassigned'
                        : npc.locationId === currentLocationId; // Target is a specific location

                    // If it's NOT in the current location, we always keep it
                    if (!isInCurrentLocation) {
                        return true;
                    }
                    
                    // If it IS in the current location, we only keep it if its name is NOT being uploaded
                    // This effectively removes the old version to be replaced by the new one.
                    return !uploadedNpcNames.has(npc.name);
                });
                
                onUpdate([...existingNpcsToKeep, ...newNpcs]);
                
                log(`Successfully populated ${newNpcs.length} NPCs, replacing duplicates.`);
                alert(`${newNpcs.length} NPC(s) populated successfully! Existing NPCs with matching names were replaced.`);
            } else if (!failedFiles) {
                 alert("No valid NPC data was found in the selected file(s).");
            }

        } catch (error) {
            console.error("An unexpected error occurred during NPC upload:", error);
            log("Unexpected NPC upload error", error, "ERROR");
            alert("An unexpected error occurred while uploading NPCs.");
        } finally {
            event.target.value = ''; // Reset file input
        }
    };

    const handleGenerateImage = async (npc: NPC) => {
        if (generatingImageId) return;
        setGeneratingImageId(npc.id);
        log('UI: handleGenerateImage called for NPC', { npcId: npc.id, npcName: npc.name });
        try {
            const imageUrl = await generateNpcImage(npc);
            handleUpdateItem(npc.id, 'image', imageUrl);
        } catch (error) {
            log('UI: Caught error in GameWorldView', error, 'ERROR');
            console.error("Failed to generate NPC image:", error);
            if (error instanceof Error) {
                alert(error.message);
            } else {
                alert("An error occurred while trying to generate the portrait.");
            }
        } finally {
            setGeneratingImageId(null);
        }
    };
    
    const handleDownloadNpc = async (npc: NPC) => {
        try {
            const npcToSave = { ...npc };

            // If there's a blob URL, convert it back to a base64 data URL for export
            if (npcToSave.image && npcToSave.image.startsWith('blob:')) {
                const response = await fetch(npcToSave.image);
                const blob = await response.blob();
                npcToSave.image = await blobToBase64(blob);
            }

            const jsonString = JSON.stringify(npcToSave, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const safeFileName = npc.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            a.download = `npc_${safeFileName}.json`;
            a.href = url;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            log("NPC data downloaded.", npcToSave);
        } catch (error) {
            console.error("Failed to download NPC data:", error);
            log("Failed to download NPC data.", error, "ERROR");
            alert("An error occurred while preparing the NPC for download.");
        }
    };

    const allNpcsSorted = [...gameWorld.npcs].sort((a, b) => a.name.localeCompare(b.name));
    const filteredNPCs = gameWorld.npcs.filter(npc => {
        if (selectedLocationId === 'unassigned') return !npc.locationId;
        return npc.locationId === selectedLocationId;
    }).sort((a, b) => a.name.localeCompare(b.name));
    
    const handleNpcCardClick = (locationId: string | null | undefined) => {
        setSelectedLocationId(locationId || 'unassigned');
    };

    return (
        <div className="space-y-4">
            {/* Location Selector Dropdown */}
            <div className="mb-4">
                <label htmlFor="location-select" className="block text-sm font-medium text-gray-400 mb-1">
                    View NPCs by Location
                </label>
                <select
                    id="location-select"
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                    <option value="all">All NPCs (World View)</option>
                    <option value="unassigned">Unassigned</option>
                    {gameWorld.locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                </select>
            </div>

            {selectedLocationId === 'all' ? (
                // World View: Read-only list of all NPCs
                 <div className="space-y-2">
                    {allNpcsSorted.length > 0 ? allNpcsSorted.map(npc => {
                        const locationName = gameWorld.locations.find(l => l.id === npc.locationId)?.name || 'Unassigned';
                        return (
                            <button
                                key={npc.id}
                                onClick={() => handleNpcCardClick(npc.locationId)}
                                className="w-full text-left bg-gray-800 p-3 rounded-lg border border-gray-700 hover:border-indigo-500 hover:bg-gray-700/50 transition-colors flex justify-between items-center"
                                title={`View NPCs in ${locationName}`}
                            >
                                <span className="font-semibold text-indigo-400">{npc.name}</span>
                                <span className="text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded-full">{locationName}</span>
                            </button>
                        );
                    }) : (
                        <div className="text-center py-6">
                            <p className="text-gray-500">No NPCs exist in this world yet.</p>
                            <p className="text-gray-500 text-sm mt-1">Select a location from the dropdown to start adding NPCs.</p>
                        </div>
                    )}
                </div>
            ) : (
                // Location View: Full editor
                <>
                    {/* Add NPC Form */}
                    <form onSubmit={handleAddItem} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-2">
                         <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold">Add New NPC to {
                                selectedLocationId === 'unassigned' 
                                ? 'Unassigned' 
                                : gameWorld.locations.find(l => l.id === selectedLocationId)?.name
                            }</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="flex items-center gap-2 text-sm bg-indigo-600/50 text-indigo-300 px-3 py-1 rounded-md hover:bg-indigo-600/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Generate new NPCs with AI"
                                >
                                    <D20Icon className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                                    <span className="hidden sm:inline">Generate</span>
                                </button>
                                <label
                                    htmlFor="npc-upload"
                                    className="flex items-center gap-2 text-sm bg-gray-600/50 text-gray-300 px-3 py-1 rounded-md hover:bg-gray-600/80 transition-colors cursor-pointer"
                                    title="Upload NPCs from JSON files"
                                >
                                    <UploadIcon className="h-4 w-4" />
                                    <span className="hidden sm:inline">Populate</span>
                                </label>
                                <input
                                    type="file"
                                    id="npc-upload"
                                    accept=".json"
                                    multiple
                                    className="hidden"
                                    onChange={handleUploadNpcs}
                                />
                            </div>
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
                               <div key={item.id} className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex items-start gap-3">
                                   <div className="w-20 h-20 bg-gray-900 rounded flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                                       {item.image && !isGeneratingThisImage && (
                                           <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                       )}
                                       {!item.image && !isGeneratingThisImage && (
                                           <ImageIcon className="w-10 h-10 text-gray-600" />
                                       )}
                                       {isGeneratingThisImage && (
                                           <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                               <D20Icon className="w-8 h-8 text-indigo-400 animate-spin" />
                                           </div>
                                       )}
                                   </div>
                                   <div className="flex-grow min-w-0">
                                        <div className="flex justify-between items-center gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                                                className="text-lg font-bold bg-transparent focus:outline-none focus:bg-gray-700 rounded px-1 w-full text-indigo-400 truncate"
                                            />
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
                                        </div>
                                       <textarea
                                           value={item.description}
                                           onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                                           className="w-full text-sm bg-transparent focus:outline-none focus:bg-gray-700 rounded px-1 text-gray-400 resize-y"
                                           rows={3}
                                       />
                                       <div className="flex items-center justify-end gap-2 mt-2">
                                            <button
                                               onClick={() => handleDownloadNpc(item)}
                                               className="flex items-center gap-1 text-xs bg-gray-600/50 text-gray-300 px-2 py-1 rounded-md hover:bg-gray-600/80 transition-colors"
                                               title="Download NPC data"
                                           >
                                               <DownloadIcon className="h-3 w-3" />
                                               <span className="hidden sm:inline">Save</span>
                                           </button>
                                            <button 
                                               onClick={() => handleGenerateImage(item)}
                                               disabled={isGeneratingThisImage || !!generatingImageId}
                                               className="flex items-center gap-1 text-xs bg-teal-600/50 text-teal-300 px-2 py-1 rounded-md hover:bg-teal-600/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                               title="Generate portrait with AI"
                                           >
                                               <ImageIcon className={`h-3 w-3 ${isGeneratingThisImage ? 'animate-pulse' : ''}`} />
                                               <span className="hidden sm:inline">{isGeneratingThisImage ? '...' : 'Portrait'}</span>
                                           </button>
                                           <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-400 text-xs">Delete</button>
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
                </>
            )}
        </div>
    );
};

const GameWorldView: React.FC<GameWorldViewProps> = ({ gameWorld, onGameWorldChange }) => {
  const [activeTab, setActiveTab] = useState<Tab>('NPCs');
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