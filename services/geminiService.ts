

import { GoogleGenAI, Part, Type, Modality } from "@google/genai";
import { GameWorld, NewLocationData, NewNPCData, NewQuestData, NPC } from '../types';
import { fileToGenerativePart } from '../utils/fileUtils';

const MODEL_NAME = 'gemini-2.5-flash';

if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const serializeGameWorld = (gameWorld: GameWorld): string => {
    let context = `--- GAME WORLD LORE ---\n${gameWorld.lore}\n\n`;

    if (gameWorld.npcs.length > 0) {
        context += `--- KEY NPCs ---\n`;
        gameWorld.npcs.forEach(npc => {
            context += `- ${npc.name}: ${npc.description}\n`;
        });
        context += '\n';
    }

    if (gameWorld.locations.length > 0) {
        context += `--- KEY LOCATIONS ---\n`;
        gameWorld.locations.forEach(loc => {
            context += `- ${loc.name}: ${loc.description}\n`;
        });
        context += '\n';
    }

    if (gameWorld.quests.length > 0) {
        context += `--- ACTIVE QUESTS ---\n`;
        gameWorld.quests.filter(q => q.status === 'Active').forEach(quest => {
            context += `- ${quest.title}: ${quest.description}\n`;
        });
        context += '\n';
    }

    return context;
};


export const generateTurnResponse = async (
    gameWorld: GameWorld,
    playerState: string,
    action: string
): Promise<string> => {
    const prompt = `
You are a master storyteller and Game Master for a Play-by-Mail fantasy roleplaying game.
Your task is to interpret a player's action and describe the outcome in a compelling and narrative way.
The response should be consistent with the established game world and the specific character's situation.
Be fair, but also create challenges and opportunities for the player. End your response at a natural point, prompting the player for their next action without explicitly asking "What do you do?".

Crucially, if the action requires a skill check, dice roll, or causes a change in resources (like health, gold, or items), you MUST include it in a structured format within your narrative. Use the format [ROLL: description] for dice rolls and [UPDATE: resource change] for resource updates.

Example: "You attempt to sneak past the guard. [ROLL: Stealth check DC 15]. As you move, you knock over a vase. The guard turns, shouting, 'Who's there?!'"
Example: "You buy the potion from the merchant. [UPDATE: Gold -10]. The vial feels cool in your hand."

Your response should be in markdown format.

${serializeGameWorld(gameWorld)}

--- PLAYER CHARACTER SHEET & SITUATION ---
${playerState}

--- PLAYER'S ACTION ---
${action}

--- NARRATIVE OUTCOME ---
`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "An error occurred while generating the response. The spirits of the digital realm are troubled. Please check your configuration and try again.";
    }
};

export const generateAdventureHooks = async (gameWorld: GameWorld): Promise<string[]> => {
    const prompt = `
You are a creative D&D Dungeon Master. Based on the provided game world state, generate 3-5 interesting and varied adventure hooks for the players.
Each hook should be a short paragraph that presents a clear call to action, a mystery, or a problem.
The hooks should feel grounded in the world's lore, characters, and locations.
Return the hooks as a JSON array of strings.

Example format:
["A frantic merchant bursts into the tavern, claiming a family heirloom was stolen by a creature from the nearby woods.", "A strange, glowing plant has been discovered, and the local alchemist is offering a reward for a live sample."]

${serializeGameWorld(gameWorld)}

--- ADVENTURE HOOKS (JSON Array) ---
`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
        });

        const text = response.text;
        // Clean up the text to ensure it's valid JSON
        const jsonString = text.substring(text.indexOf('['), text.lastIndexOf(']') + 1);
        const hooks = JSON.parse(jsonString);
        return Array.isArray(hooks) ? hooks : [];

    } catch (error) {
        console.error("Error generating adventure hooks:", error);
        return ["Failed to generate adventure hooks. The muse is silent."];
    }
};

export const generateLoreFromFiles = async (files: File[]): Promise<string> => {
    const prompt = `You are a world-building assistant for a fantasy roleplaying game. The user has uploaded the following files containing notes, images, and documents about their world.
Synthesize all of this information into a cohesive and well-structured "World Lore" document.
This document should serve as the foundational context for a new game campaign.
Structure it with clear headings for different sections like History, Key Factions, Important Locations, and Major Plot Points.
The tone should be evocative and engaging, suitable for a fantasy setting.
Extract key information and present it clearly. If there are inconsistencies, try to merge them logically or present them as 'conflicting historical accounts'.`;

    try {
        const fileParts: Part[] = await Promise.all(
            files.map(file => fileToGenerativePart(file))
        );
        
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: { parts: [{ text: prompt }, ...fileParts] },
        });

        return response.text;
    } catch (error) {
        console.error("Error generating lore from files:", error);
        return "Error: Could not generate lore from the provided files. Please ensure they are supported formats (text, markdown, png, jpg) and try again.";
    }
};

/**
 * Generic helper to generate game entities (NPCs, Locations, Quests).
 */
const generateEntity = async <T>(
    gameWorld: GameWorld,
    entityName: string,
    promptText: string,
    responseSchema: any
): Promise<T[]> => {
    const prompt = `
You are a creative D&D Dungeon Master. Based on the provided game world state, ${promptText}.
The output MUST be a JSON array of objects. Do not include markdown formatting.

${serializeGameWorld(gameWorld)}

--- NEW ${entityName.toUpperCase()}S (JSON Array) ---
`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: responseSchema,
                },
            },
        });

        const jsonString = response.text.trim();
        const entities = JSON.parse(jsonString);
        return Array.isArray(entities) ? entities : [];

    } catch (error) {
        console.error(`Error generating ${entityName}:`, error);
        throw new Error(`Failed to generate ${entityName}.`);
    }
};

export const generateNPCs = (gameWorld: GameWorld): Promise<NewNPCData[]> => {
    return generateEntity<NewNPCData>(
        gameWorld,
        'NPCs',
        "generate 2-3 new, interesting Non-Player Characters (NPCs). They should feel grounded in the world's lore.",
        {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
            },
            required: ['name', 'description'],
        }
    );
};

export const generateLocations = (gameWorld: GameWorld): Promise<NewLocationData[]> => {
    return generateEntity<NewLocationData>(
        gameWorld,
        'Locations',
        "generate 2-3 new, interesting locations. They should feel grounded in the world's lore.",
        {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
            },
            required: ['name', 'description'],
        }
    );
};

export const generateQuests = (gameWorld: GameWorld): Promise<NewQuestData[]> => {
    return generateEntity<NewQuestData>(
        gameWorld,
        'Quests',
        "generate 2-3 new, interesting quests. They should feel grounded in the world's lore and current plot points.",
        {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
            },
            required: ['title', 'description'],
        }
    );
};

export const generateNpcImage = async (npc: NPC): Promise<string> => {
    const prompt = `A detailed fantasy character portrait of ${npc.name}, who is described as: "${npc.description}". Epic, detailed, fantasy art style, vibrant colors. No text or watermarks.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        // Check for prompt-level safety blocks
        if (response.promptFeedback?.blockReason) {
            throw new Error(`Image generation blocked. Reason: ${response.promptFeedback.blockReason}`);
        }

        const candidate = response.candidates?.[0];

        // Check for candidate-level safety blocks or lack of a candidate
        if (!candidate) {
            throw new Error("No response candidate found. The model may not have generated an image.");
        }
        
        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
             throw new Error(`Image generation failed. Reason: ${candidate.finishReason}`);
        }
        
        // Safely access the image data
        if (candidate.content && Array.isArray(candidate.content.parts)) {
            for (const part of candidate.content.parts) {
                if (part.inlineData?.data) {
                    const base64ImageBytes: string = part.inlineData.data;
                    return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                }
            }
        }
        
        throw new Error("No image data found in the API response.");

    } catch (error) {
        console.error("Error generating NPC image:", error);
        if (error instanceof Error) {
            // Re-throw the specific error to be displayed in the UI
            throw error;
        }
        // Fallback for non-Error exceptions
        throw new Error("An unknown error occurred during image generation.");
    }
};
