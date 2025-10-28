import { GoogleGenAI } from "@google/genai";
import { GameWorld, Player } from '../types';

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
