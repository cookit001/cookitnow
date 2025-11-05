import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
// Fix: Corrected import path for types
import type { Recipe, RecipeVariant, ConversionResult, GroundingChunk, UserProfile, Language, MealPlan, PantryItem, PantryCategory, Tutorial, Message, ExplorePageContent, FoodNewsItem, ImageAnalysisInventoryItem, ExploreCard, ExploreCuisine, ExploreTechnique, ImageAnalysisResult, IngredientSubstitute, BeveragePairings, GarnishIdea, KitchenSafetyTip } from '../types.ts';
import { PANTRY_CATEGORIES } from '../types.ts';

// Helper function to robustly parse JSON from a string
// Fix: Converted to a generic function to provide strong typing for parsed JSON objects.
const parseJsonGracefully = <T,>(jsonString: string): T => {
    try {
        // Attempt to find the start of a JSON object or array
        const jsonStart = jsonString.indexOf('{');
        const arrayStart = jsonString.indexOf('[');
        let start = -1;

        if (jsonStart === -1 && arrayStart === -1) throw new Error("No JSON object or array found in the string.");

        if (jsonStart !== -1 && (jsonStart < arrayStart || arrayStart === -1)) {
            start = jsonStart;
        } else {
            start = arrayStart;
        }

        // Attempt to find the corresponding end
        const end = jsonString.lastIndexOf(start === jsonStart ? '}' : ']');
        if (end === -1) throw new Error("Could not find valid JSON end delimiter.");

        const potentialJson = jsonString.substring(start, end + 1);
        return JSON.parse(potentialJson) as T;

    } catch (e) {
        console.error("Failed to parse JSON response from Cook AI:", jsonString);
        throw new Error("Cook AI's response was not in the expected format. Please try again.");
    }
};

const buildProfilePrompt = (profile: UserProfile): string => {
    let prompt = `---
User Profile Context:
- Language: Respond in ${profile.language}.
- Cooking Skill Level: ${profile.skillLevel}. Tailor recipe complexity and instruction detail accordingly. For Beginners, explain steps simply. For Experts, you can be more concise.`;

    if (profile.privacySettings?.allowPersonalization) {
        if (profile.allergies && profile.allergies.length > 0) {
            prompt += `
- CRITICAL SAFETY INSTRUCTION: The user is allergic to ${profile.allergies.join(', ')}. YOU MUST NOT suggest recipes containing these ingredients under any circumstances. This is a life-or-death instruction.`
        }
        if (profile.dislikedIngredients && profile.dislikedIngredients.length > 0) {
            prompt += `
- Disliked Ingredients: The user strongly dislikes ${profile.dislikedIngredients.join(', ')}. Avoid suggesting recipes with these ingredients.`
        }
        prompt += `
- Dietary Restrictions: ${profile.dietaryRestrictions.length > 0 ? profile.dietaryRestrictions.join(', ') : 'None specified'}. Strictly adhere to these.
- Taste Preferences: ${profile.tastePreferences.length > 0 ? profile.tastePreferences.join(', ') : 'None specified'}.
- Favorite Cuisines: ${profile.favoriteCuisines.length > 0 ? profile.favoriteCuisines.join(', ') : 'None specified'}. Prioritize these when appropriate.
- Cooking Goals: ${profile.cookingGoals.length > 0 ? profile.cookingGoals.join(', ') : 'None specified'}. Suggest recipes that help achieve these goals (e.g., if goal is 'eat healthier', suggest lower-calorie meals).
- Available Equipment: ${profile.availableEquipment.length > 0 ? profile.availableEquipment.join(', ') : 'Standard kitchen equipment'}. Suggest recipes that can use this equipment.
- Budget Mode: ${profile.budgetMode ? 'Enabled (suggest affordable ingredients and techniques)' : 'Disabled'}.`;
        
        if (profile.nutritionGoals && (profile.nutritionGoals.calories > 0 || profile.nutritionGoals.protein > 0 || profile.nutritionGoals.carbs > 0 || profile.nutritionGoals.fat > 0)) {
            prompt += `
- Nutrition Goals: Aim for recipes that align with these daily targets: ~${profile.nutritionGoals.calories || 'any'} calories, ~${profile.nutritionGoals.protein || 'any'}g protein, ~${profile.nutritionGoals.carbs || 'any'}g carbs, ~${profile.nutritionGoals.fat || 'any'}g fat.`;
        }

        if (profile.pantry && profile.pantry.length > 0) {
             prompt += `
- Pantry contains: ${profile.pantry.map(i => {
    let itemStr = `${i.name} (${i.quantity})`;
    if (i.expiryDate) {
        const daysUntilExpiry = Math.ceil((new Date(i.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry < 0) itemStr += ' (Expired)';
        else if (daysUntilExpiry <= 7) itemStr += ` (Expires in ${daysUntilExpiry} days)`;
    }
    return itemStr;
}).join(', ')}. Prioritize using items that are expiring soon to reduce waste.`;
        }
        
        if (profile.rememberedPeople && profile.rememberedPeople.length > 0) {
            prompt += `
- People to remember: ${profile.rememberedPeople.map(p => `${p.name} (${p.details})`).join('; ')}. Refer to this information when relevant.`;
        }

        // New Pantry History Analysis for Hyper-Personalization
        if (profile.pantryHistory && profile.pantryHistory.length > 0) {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            
            const recentHistory = profile.pantryHistory.filter(item => new Date(item.addedAt) > oneMonthAgo);
            const frequency: Record<string, number> = {};
            recentHistory.forEach(item => {
                const name = item.name.toLowerCase();
                frequency[name] = (frequency[name] || 0) + 1;
            });

            const frequentItems = Object.entries(frequency)
                .filter(([, count]) => count > 2) // Items added more than twice in the last month
                .sort((a, b) => b[1] - a[1])
                .map(([name]) => name);

            if (frequentItems.length > 0) {
                prompt += `
- Pantry Insights: The user frequently buys ${frequentItems.join(', ')}. Proactively suggest recipes using these ingredients.`;
            }
        }

    } else {
        prompt += `
- Personalization is DISABLED. Provide generic responses without using the user's personal data.`;
    }
    prompt += '\n---';
    return prompt;
};

const mealPlanSchema = {
    type: Type.OBJECT,
    properties: {
        "Monday": { type: Type.OBJECT, properties: { breakfast: { type: Type.STRING }, lunch: { type: Type.STRING }, dinner: { type: Type.STRING } }, required: ['breakfast', 'lunch', 'dinner'] },
        "Tuesday": { type: Type.OBJECT, properties: { breakfast: { type: Type.STRING }, lunch: { type: Type.STRING }, dinner: { type: Type.STRING } }, required: ['breakfast', 'lunch', 'dinner'] },
        "Wednesday": { type: Type.OBJECT, properties: { breakfast: { type: Type.STRING }, lunch: { type: Type.STRING }, dinner: { type: Type.STRING } }, required: ['breakfast', 'lunch', 'dinner'] },
        "Thursday": { type: Type.OBJECT, properties: { breakfast: { type: Type.STRING }, lunch: { type: Type.STRING }, dinner: { type: Type.STRING } }, required: ['breakfast', 'lunch', 'dinner'] },
        "Friday": { type: Type.OBJECT, properties: { breakfast: { type: Type.STRING }, lunch: { type: Type.STRING }, dinner: { type: Type.STRING } }, required: ['breakfast', 'lunch', 'dinner'] },
        "Saturday": { type: Type.OBJECT, properties: { breakfast: { type: Type.STRING }, lunch: { type: Type.STRING }, dinner: { type: Type.STRING } }, required: ['breakfast', 'lunch', 'dinner'] },
        "Sunday": { type: Type.OBJECT, properties: { breakfast: { type: Type.STRING }, lunch: { type: Type.STRING }, dinner: { type: Type.STRING } }, required: ['breakfast', 'lunch', 'dinner'] },
    },
    required: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
};


const recipeSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        cookingTime: { type: Type.STRING, description: "e.g., '30 minutes'" },
        prepTime: { type: Type.STRING, description: "e.g., '15 minutes'" },
        cuisine: { type: Type.STRING, description: "e.g., 'Italian', 'Mexican'" },
        tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "e.g., ['Vegan', 'Gluten-Free']" },
        difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
        servings: { type: Type.STRING },
        ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
        instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
        flavorProfile: {
            type: Type.OBJECT,
            properties: {
                sweet: { type: Type.NUMBER, description: "Sweetness level from 0 to 100" },
                spicy: { type: Type.NUMBER, description: "Spiciness level from 0 to 100" },
                salty: { type: Type.NUMBER, description: "Saltiness level from 0 to 100" },
                sour: { type: Type.NUMBER, description: "Sourness level from 0 to 100" },
                bitter: { type: Type.NUMBER, description: "Bitterness level from 0 to 100" },
                umami: { type: Type.NUMBER, description: "Umami/savory level from 0 to 100" },
            },
            required: ['sweet', 'spicy', 'salty', 'sour', 'bitter', 'umami'],
        },
        foodLore: { type: Type.STRING, description: "A short, fascinating story or fun fact about the recipe's origin, a key ingredient, or its cultural significance." }
    },
    required: ['title', 'description', 'cookingTime', 'difficulty', 'servings', 'ingredients', 'instructions', 'flavorProfile', 'foodLore'],
};

// --- Function Declarations for Sous Chef Mode & Assistant ---
export const assistantTools: FunctionDeclaration[] = [
    {
        name: 'addToShoppingList',
        description: 'Adds one or more items to the user\'s shopping list.',
        parameters: { type: Type.OBJECT, properties: { items: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'The grocery items to add.' } }, required: ['items'] }
    },
     {
        name: 'getIngredientSubstitute',
        description: 'Finds a substitute for a given ingredient in the context of a recipe.',
        parameters: { type: Type.OBJECT, properties: { ingredient: { type: Type.STRING, description: 'The ingredient to replace.' }, recipeContext: { type: Type.STRING, description: 'The title or description of the recipe for context.' } }, required: ['ingredient', 'recipeContext'] }
    },
    {
        name: 'getBeveragePairingForDish',
        description: 'Suggests beverage pairings (wine, beer, non-alcoholic) for a given dish.',
        parameters: { type: Type.OBJECT, properties: { dishDescription: { type: Type.STRING, description: 'A description of the dish for which to find pairings.' } }, required: ['dishDescription'] }
    },
    {
        name: 'scaleIngredients',
        description: 'Scales a list of ingredients from a starting serving size to a target serving size.',
        parameters: { type: Type.OBJECT, properties: { ingredients: { type: Type.ARRAY, items: { type: Type.STRING } }, fromServings: { type: Type.STRING }, toServings: { type: Type.STRING } }, required: ['ingredients', 'fromServings', 'toServings'] }
    },
    {
        name: 'getGarnishIdeas',
        description: 'Provides creative garnish ideas for a described dish.',
        parameters: { type: Type.OBJECT, properties: { dishDescription: { type: Type.STRING, description: 'A description of the dish to be garnished.' } }, required: ['dishDescription'] }
    },
    {
        name: 'getKitchenSafetyTip',
        description: 'Provides a crucial kitchen safety tip related to a specific topic.',
        parameters: { type: Type.OBJECT, properties: { topic: { type: Type.STRING, description: 'The safety topic (e.g., "raw chicken", "deep frying").' } }, required: ['topic'] }
    },
    {
        name: 'convertUnits',
        description: 'Converts a measurement from one unit to another (e.g., "1 cup" to "grams").',
        parameters: { type: Type.OBJECT, properties: { from: { type: Type.STRING, description: 'The measurement to convert, e.g., "1 cup of flour"' }, to: { type: Type.STRING, description: 'The target unit, e.g., "grams"' } }, required: ['from', 'to'] }
    }
];

export const sousChefTools: FunctionDeclaration[] = [
    {
        name: 'goToStep',
        description: 'Navigate to a specific step in the recipe.',
        parameters: { type: Type.OBJECT, properties: { stepNumber: { type: Type.NUMBER, description: 'The 1-based index of the recipe step to go to.' } }, required: ['stepNumber'] }
    },
    {
        name: 'setTimer',
        description: 'Set a timer for a specific duration.',
        parameters: { type: Type.OBJECT, properties: { durationInSeconds: { type: Type.NUMBER, description: 'The duration of the timer in seconds.' }, timerLabel: { type: Type.STRING, description: 'A label for the timer, e.g., "rice timer".' } }, required: ['durationInSeconds', 'timerLabel'] }
    },
    {
        name: 'getIngredientSubstitute',
        description: 'Finds a substitute for a given ingredient in the context of the current recipe.',
        parameters: { type: Type.OBJECT, properties: { ingredient: { type: Type.STRING, description: 'The ingredient to replace.' } }, required: ['ingredient'] }
    },
];

export async function isRecipeRequest(message: string, profile: UserProfile): Promise<boolean> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const profilePrompt = buildProfilePrompt(profile);
    const fullPrompt = `${profilePrompt}\n\nUser message: "${message}"\n\nIs this message a direct request for a recipe, meal plan, or specific food instructions? Respond with only the word "yes" or "no".`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // Use a fast model for classification
            contents: fullPrompt,
            config: {
                temperature: 0, // Be deterministic
            },
        });
        const result = response.text.trim().toLowerCase();
        return result.includes('yes');
    } catch (error) {
        console.error("Error in isRecipeRequest:", { error, prompt: fullPrompt });
        // Default to assuming it's not a recipe request to allow for conversation on error.
        return false; 
    }
}

export async function getConversationalResponse(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[], profile: UserProfile, lastRecipe: Recipe | null, systemInstructionOverride?: string): Promise<any> { // Returns GenerateContentResponse
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const profilePrompt = buildProfilePrompt(profile);
    
    // Create a simplified history for the conversational model
    const conversationHistory = history.slice(-6).map(h => ({
        role: h.role,
        parts: h.parts,
    }));

    let recipeContext = '';
    if (lastRecipe) {
        recipeContext = `The user was just looking at a recipe for "${lastRecipe.title}". Keep this in mind when answering their question. This is the recipe context for any function calls.`;
    }

    const defaultSystemInstruction = `You are Cook, a friendly, extremely intelligent, and proactive AI cooking assistant. Your primary goal is to be helpful and accurate. Pay close attention to the user's tone and phrasing to understand their current mindset (e.g., are they in a hurry, feeling creative, being health-conscious, or a beginner needing extra help?) and adapt your response style accordingly. For any question that isn't a direct command for your tools or a simple greeting, you MUST default to using the search tool to find and verify up-to-date information, and you MUST provide citations. Be proactive in offering factual, cited information. If the user asks for an action you can perform with a tool (like adding to a shopping list or finding a substitute), use the tool. Do not generate recipes or lists in conversational mode unless using a tool. ${recipeContext} ${profilePrompt}`;
    const systemInstruction = systemInstructionOverride || defaultSystemInstruction;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: {
                role: 'user', 
                parts: [{ text: message }]
            },
            config: {
              systemInstruction: systemInstruction,
              tools: [{ googleSearch: {} }, { functionDeclarations: assistantTools }],
              thinkingConfig: { thinkingBudget: 32768 },
            },
        });

        // Return the whole response object to handle function calls and citations in the App component
        return response; 
    } catch (error) {
        console.error("Error in getConversationalResponse:", error);
        // Return a response-like object for consistency
        return { text: "I'm sorry, I had a little trouble thinking there. Could you say that again?", candidates: [] };
    }
}


export async function getChatResponse(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[], profile: UserProfile): Promise<Recipe> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const model = 'gemini-2.5-pro';
    const profilePrompt = buildProfilePrompt(profile);

    const relevantHistory = history.slice(-6).map(h => `${h.role === 'user' ? 'User' : 'Cook'}: ${h.parts[0].text}`).join('\n');

    const fullPrompt = `${profilePrompt}\n\nHere is the recent conversation history for context:\n${relevantHistory}\n\nUser's latest message: "${message}"\n\nBased on the user's latest message AND the preceding conversation history, generate a single, creative recipe that directly addresses the user's full request, keeping their profile in mind. If the user specifies a mood (e.g., 'happy', 'tired', 'stressed', 'celebratory'), the recipe should match that mood. Also, include a "foodLore" field with an interesting fact or story about the dish. The recipe must be a valid JSON object matching the provided schema. The description should be engaging, and the flavor profile analysis should be nuanced. Your entire response must be ONLY the JSON object.`;
    
    console.log("Sending prompt to Cook AI for recipe generation:", fullPrompt);

    try {
        const response = await ai.models.generateContent({
            model,
            contents: fullPrompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: recipeSchema,
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        const jsonText = response.text.trim();
        return parseJsonGracefully<Recipe>(jsonText);
    } catch (error) {
        console.error("Error in getChatResponse:", { error, prompt: fullPrompt });
        throw new Error("Cook AI had trouble generating a recipe. Please try rephrasing your request.");
    }
}

export async function getRecipeVariations(recipe: Recipe, profile: UserProfile): Promise<RecipeVariant[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `Generate 3 creative variations for the recipe "${recipe.title}". For each variation, provide a new title, a short description, modified ingredients and instructions, and also include its estimated prep time, cuisine, and relevant tags. Your entire response must be ONLY a JSON array of objects. ${buildProfilePrompt(profile)}`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, ingredients: { type: Type.ARRAY, items: { type: Type.STRING } }, instructions: { type: Type.ARRAY, items: { type: Type.STRING } }, prepTime: { type: Type.STRING }, cuisine: { type: Type.STRING }, tags: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['title', 'description', 'ingredients', 'instructions'] } },
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        const result = parseJsonGracefully<RecipeVariant[]>(response.text.trim());
        if (!Array.isArray(result)) {
            console.error("getRecipeVariations received non-array response:", result);
            throw new Error("Cook AI returned variations in an unexpected format.");
        }
        return result;
    } catch (error) {
         console.error("Error in getRecipeVariations:", { error, prompt });
        throw new Error("Cook AI couldn't come up with variations right now.");
    }
}

export async function generateDishImage(prompt: string, style: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const fullPrompt = `${prompt}, in the style of ${style}. Food photography, vibrant colors, appetizing, high-detail.`;
    
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: fullPrompt,
            config: { numberOfImages: 1, aspectRatio: '16:9' },
        });
        return response.generatedImages[0].image.imageBytes;
    } catch(error) {
        console.error("Error in generateDishImage:", { error, prompt: fullPrompt });
        throw new Error("Cook AI's camera seems to be broken. Could not visualize the dish.");
    }
}


export async function getFoodNews(language: Language): Promise<FoodNewsItem[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `Summarize 3-4 of the most interesting and recent news, trends, or discussions in the food and cooking world. For each item, provide a concise title and a short summary (2-3 sentences). Use your search tool to get up-to-date information. Respond in ${language}. Your entire response must be a valid JSON array of objects, where each object has a "title" and a "summary" key.`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { 
                tools: [{ googleSearch: {} }],
            },
        });
        
        const newsItems: FoodNewsItem[] = parseJsonGracefully<FoodNewsItem[]>(response.text.trim());
        const citations = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

        // Associate citations with news items. We assume a 1-to-1 mapping in order.
        return newsItems.map((item, index) => ({
            ...item,
            source: citations[index]?.web,
        }));

    } catch (error) {
        console.error("Error in getFoodNews:", { error, prompt });
        throw new Error("Cook AI couldn't fetch the latest food news in the right format.");
    }
}

export async function convertUnits(from: string, to: string, language: Language): Promise<ConversionResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `Convert ${from} to ${to}. Respond in ${language}. Your response must be ONLY a JSON object.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { quantity: { type: Type.NUMBER }, unit: { type: Type.STRING } }, required: ['quantity', 'unit'] } },
        });
        return parseJsonGracefully<ConversionResult>(response.text.trim());
    } catch (error) {
        console.error("Error in convertUnits:", { error, prompt });
        throw new Error("Cook AI had trouble with the conversion.");
    }
}

export async function analyzeImage(base64Image: string, mimeType: string, profile: UserProfile): Promise<ImageAnalysisResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const profilePrompt = buildProfilePrompt(profile);
    const textPart = { text: `You are a world-class chef and food scientist. Analyze the ingredients in this image for a cooking app with an expert eye.
1.  **Inventory**: Provide a detailed inventory. For each item, estimate its quantity (e.g., '1 large', 'about 2 cups') and a brief quality assessment (e.g., 'looks fresh', 'slightly bruised').
2.  **Quality Notes**: Provide a single, one-sentence summary about the overall quality of the ingredients.
3.  **Recipes**: Suggest 3 creative and complete recipes that can be made primarily with these ingredients. For each recipe, include prep time, cuisine type, and dietary tags. Also, explain *why* it's a good choice based on the ingredients' quality and potential flavor synergy.
4.  **Additions**: List 3-4 additional common pantry items (like oil, salt, pepper) that would enhance these recipes.
5.  **Nutritional Summary**: Provide a one-paragraph summary of the key nutritional benefits of the main ingredients identified.
6.  **Health Score**: Provide a JSON object with a 'score' (0-100, where 100 is healthiest) and a brief 'reasoning' string for the overall healthiness of the ingredients shown.
7.  **Storage Tips**: Provide a JSON array of strings with 2-3 tips for storing these ingredients to maximize freshness.
8.  **Chef Tips**: Provide a JSON array of 2-3 expert-level tips for preparing or cooking these specific ingredients to maximize flavor or texture (e.g., "Consider charring the peppers to add a smoky depth before adding them to the sauce.").
${profilePrompt}. Your entire response must be a single JSON object.` };

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            inventory: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { name: { type: Type.STRING }, quantity: { type: Type.STRING }, quality: { type: Type.STRING } },
                    required: ['name', 'quantity', 'quality']
                }
            },
            qualityNotes: { type: Type.STRING },
            recipes: { type: Type.ARRAY, items: recipeSchema },
            suggestedAdditions: { type: Type.ARRAY, items: { type: Type.STRING } },
            nutritionalSummary: { type: Type.STRING },
            healthScore: {
                type: Type.OBJECT,
                properties: { score: { type: Type.NUMBER }, reasoning: { type: Type.STRING } },
                required: ['score', 'reasoning']
            },
            storageTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            chefTips: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['inventory', 'qualityNotes', 'recipes', 'suggestedAdditions', 'nutritionalSummary', 'healthScore', 'storageTips', 'chefTips']
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [{ inlineData: { data: base64Image, mimeType: mimeType } }, textPart] },
            config: { 
                responseMimeType: 'application/json', 
                responseSchema: responseSchema,
                thinkingConfig: { thinkingBudget: 32768 },
            }
        });
        return parseJsonGracefully<ImageAnalysisResult>(response.text.trim());
    } catch (error) {
        console.error("Error in analyzeImage:", { error, prompt: textPart.text });
        throw new Error("Cook AI had trouble analyzing the image.");
    }
}

export async function getLeftoverRecipe(leftovers: string, profile: UserProfile): Promise<Recipe> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `I have leftover "${leftovers}". Generate a single, creative recipe to transform these leftovers into a new meal. Include prep time, cuisine type, and relevant tags. ${buildProfilePrompt(profile)}. Your response must be ONLY a JSON object.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: recipeSchema,
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        return parseJsonGracefully<Recipe>(response.text.trim());
    } catch (error) {
        console.error("Error in getLeftoverRecipe:", { error, prompt });
        throw new Error("Cook AI is stumped on these leftovers. Try another ingredient!");
    }
}

export async function generateMealPlanFromPrompt(promptText: string, profile: UserProfile): Promise<MealPlan> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `Based on the user's request: "${promptText}", generate a full 7-day meal plan (breakfast, lunch, dinner) for a single person. Use simple, descriptive meal names (e.g., "Scrambled Eggs with Toast", not a full recipe). Be intelligent about ingredient reuse. ${buildProfilePrompt(profile)}. Your response must be ONLY a JSON object where keys are the days of the week (e.g., "Monday") and values are objects with "breakfast", "lunch", and "dinner" keys.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                systemInstruction: "You are a meal plan generation API. Your sole purpose is to receive a prompt and return a valid JSON object that conforms to the provided schema. Do not include any explanatory text, markdown formatting, or any characters outside of the JSON object in your response. Your entire output must be ONLY the JSON object itself.",
                responseMimeType: 'application/json',
                responseSchema: mealPlanSchema,
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        return parseJsonGracefully<MealPlan>(response.text.trim());
    } catch (error) {
        console.error("Error in generateMealPlanFromPrompt:", { error, prompt });
        throw new Error("Cook AI couldn't generate a meal plan from your request.");
    }
}

export async function optimizeMealPlan(currentPlan: MealPlan, profile: UserProfile): Promise<MealPlan> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `A user wants to optimize their meal plan. The goal is to maximize the use of their current pantry items, reduce ingredient overlap between meals to minimize waste, and ensure the plan aligns with their preferences. ${buildProfilePrompt(profile)}\n\nHere is their current plan:\n${JSON.stringify(currentPlan, null, 2)}\n\nPlease provide an optimized version of this 7-day meal plan. Keep the same structure. Your response must be ONLY a JSON object.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                systemInstruction: "You are a meal plan optimization API. Your sole purpose is to receive a meal plan and return an optimized, valid JSON object that conforms to the provided schema. Do not include any explanatory text, markdown formatting, or any characters outside of the JSON object in your response. Your entire output must be ONLY the JSON object itself.",
                responseMimeType: 'application/json',
                responseSchema: mealPlanSchema,
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        return parseJsonGracefully<MealPlan>(response.text.trim());
    } catch (error) {
        console.error("Error in optimizeMealPlan:", { error, prompt });
        throw new Error("Cook AI couldn't optimize the meal plan right now.");
    }
}


export async function generateFusedRecipe(recipe1: Recipe, recipe2: Recipe, profile: UserProfile): Promise<Recipe> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `Create a new, exciting, and coherent "fusion" recipe that combines elements from "${recipe1.title}" and "${recipe2.title}". Invent a creative name. Include prep time, cuisine type, and relevant tags. The instructions should be clear and logical. ${buildProfilePrompt(profile)}. Your response must be ONLY a JSON object.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json', 
                responseSchema: recipeSchema,
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        return parseJsonGracefully<Recipe>(response.text.trim());
    } catch (error) {
        console.error("Error in generateFusedRecipe:", { error, prompt });
        throw new Error("Cook AI's fusion experiment didn't work out. Try a different combination!");
    }
}

export async function categorizePantryItem(itemName: string): Promise<PantryCategory> {
    if (!itemName.trim()) {
        return 'Other';
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `Categorize the food item "${itemName}" into one of the following categories: ${PANTRY_CATEGORIES.join(', ')}. Your response must be ONLY a JSON object. If you are unsure, categorize it as "Other".`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        category: { type: Type.STRING, enum: PANTRY_CATEGORIES }
                    },
                    required: ['category']
                },
                temperature: 0, // for deterministic categorization
            },
        });
        const result = parseJsonGracefully<{ category: PantryCategory }>(response.text.trim());
        return result.category || 'Other';
    } catch (error) {
        console.error(`Error categorizing item "${itemName}":`, { error, prompt });
        return 'Other'; // Default to 'Other' on error
    }
}

async function validateAndSummarizeUrl(url: string, recipeTitle: string, language: Language): Promise<Tutorial | null> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `I am looking for a tutorial for "${recipeTitle}". Please analyze the content at this URL: ${url}. 
    First, determine if this is a valid, publicly accessible webpage containing a relevant recipe or cooking tutorial. It should not be a 404 error, a login wall, or an irrelevant page.
    If it is a valid tutorial page, provide a concise title, a one-sentence summary, and the source website name (e.g., "Food Network").
    Respond in ${language}. Your response must be ONLY a JSON object with the following structure: { "isValid": boolean, "title": string, "description": string, "source": string }. If the page is not valid, set "isValid" to false and the other fields to empty strings. Do not include any other text, markdown, or explanations.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        const result = parseJsonGracefully<{ isValid: boolean, title: string, description: string, source: string }>(response.text.trim());
        if (result.isValid) {
            return { ...result, url };
        }
        return null;
    } catch (error) {
        console.warn(`Could not validate URL ${url}:`, { error, prompt });
        return null;
    }
}

export async function getTutorials(recipeTitle: string, language: Language): Promise<Tutorial[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const searchPrompt = `Find 3 to 5 diverse, high-quality URLs for cooking tutorials (articles, blogs, or videos) for a recipe called "${recipeTitle}". Prioritize well-known recipe sites. Respond with ONLY a JSON array of strings, where each string is a URL. Do not include any other text, markdown, or explanation.`;

    try {
        // Step 1: Get a list of potential URLs
        const urlResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: searchPrompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        const urls = parseJsonGracefully<string[]>(urlResponse.text.trim());

        if (!Array.isArray(urls)) {
            throw new Error("Could not find a list of tutorial URLs.");
        }

        // Step 2: Validate each URL concurrently
        const validationPromises = urls.slice(0, 5).map(url => validateAndSummarizeUrl(url, recipeTitle, language));
        const validatedResults = await Promise.all(validationPromises);
        
        // Filter out nulls (invalid links) and return the valid ones
        return validatedResults.filter((result): result is Tutorial => result !== null);

    } catch (error) {
        console.error("Error in getTutorials:", { error, prompt: searchPrompt });
        throw new Error("Cook AI couldn't find any verified tutorials for this recipe right now.");
    }
}

export async function optimizeShoppingList(items: string[]): Promise<{category: string; items: string[]}[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `Organize the following shopping list items into common supermarket categories (e.g., Produce, Dairy & Eggs, Meat & Seafood, Pantry & Dry Goods, Bakery, Frozen Foods, Beverages, Household). If an item doesn't fit well, use an "Other" category. Here is the list: ${items.join(', ')}. Your response must be ONLY a JSON array of objects. Each object should have a "category" (string) key and an "items" (array of strings) key.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            category: { type: Type.STRING },
                            items: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ['category', 'items']
                    }
                },
            },
        });
        return parseJsonGracefully<{category: string; items: string[]}[]>(response.text.trim());
    } catch (error) {
        console.error("Error in optimizeShoppingList:", { error, prompt });
        throw new Error("Cook AI had trouble optimizing your shopping list.");
    }
}

export async function extractItemsFromList(text: string): Promise<string[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `From the following text, extract all food and grocery items. Be specific (e.g., if the user says "a dozen eggs", extract "12 eggs"). Ignore non-grocery items. Your response must be ONLY a JSON array of strings. Text: "${text}"`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            },
        });
        return parseJsonGracefully<string[]>(response.text.trim());
    } catch (error) {
        console.error("Error in extractItemsFromList:", { error, prompt });
        throw new Error("Cook AI had trouble understanding your list.");
    }
}

export async function generateChatTitle(history: { role: 'user' | 'model', parts: { text: string }[] }[]): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `Based on the following conversation, generate a concise and descriptive title with a maximum of 5 words. Respond with ONLY the title text, nothing else.\n\nConversation:\n${history.map(h => `${h.role}: ${h.parts[0].text}`).join('\n')}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.2,
                stopSequences: ['\n'],
            },
        });
        return response.text.trim().replace(/"/g, ''); // Clean up potential quotes
    } catch (error) {
        console.error("Error in generateChatTitle:", { error, prompt });
        return "Untitled Chat";
    }
}

export async function getTrendingDishName(profile: UserProfile): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const profilePrompt = buildProfilePrompt(profile);
    const prompt = `Based on current online trends and seasonality, what is one specific, popular dish that people are interested in cooking right now? Use your search tool to find up-to-date information. Respond with ONLY the name of the dish (e.g., "Spicy Vodka Pasta"). Do not add any other text or punctuation. ${profilePrompt}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                temperature: 0.7, // A bit of creativity in picking a trend
            },
        });
        const dishName = response.text.trim().replace(/"/g, '');
        if (!dishName) {
            throw new Error("Could not determine a trending dish.");
        }
        return dishName;
    } catch (error) {
        console.error("Error in getTrendingDishName:", { error, prompt });
        throw new Error("Cook AI couldn't find a popular dish right now. Please try a specific request.");
    }
}

export async function getExplorePageContent(profile: UserProfile): Promise<ExplorePageContent> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const profilePrompt = buildProfilePrompt(profile);

    const dishPrompt = `Generate a "Dish of the Day" for a cooking app's explore page. It should be an exciting and visually appealing dish. Provide a creative title, a short, enticing one-paragraph description (max 50 words), and a simple prompt that could be used to generate a recipe for it. ${profilePrompt} Respond ONLY with a JSON object.`;
    const cuisinePrompt = `Generate a "Cuisine Spotlight" for a cooking app's explore page. Pick an interesting world cuisine. Provide the name of the cuisine, a brief one-paragraph description (max 60 words), and a list of 3 representative recipe names with simple prompts for each. ${profilePrompt} Respond ONLY with a JSON object.`;
    const techniquePrompt = `Generate a "Technique of the Week" for a cooking app's explore page. Pick a fundamental or interesting cooking technique (e.g., Braising, Sous Vide, Maillard Reaction). Provide the name of the technique and a simple, easy-to-understand one-paragraph explanation (max 60 words). ${profilePrompt} Respond ONLY with a JSON object.`;

    try {
        // Run all requests in parallel for efficiency
        const [dishResult, cuisineResult, techniqueResult] = await Promise.all([
            ai.models.generateContent({ model: 'gemini-2.5-pro', contents: dishPrompt, config: { responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 32768 } } }),
            ai.models.generateContent({ model: 'gemini-2.5-pro', contents: cuisinePrompt, config: { responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 32768 } } }),
            ai.models.generateContent({ model: 'gemini-2.5-pro', contents: techniquePrompt, config: { responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 32768 } } })
        ]);

        const dishOfTheDay = parseJsonGracefully<ExploreCard>(dishResult.text);
        const cuisineSpotlight = parseJsonGracefully<ExploreCuisine>(cuisineResult.text);
        const techniqueOfTheWeek = parseJsonGracefully<ExploreTechnique>(techniqueResult.text);
        
        // Generate an image for the Dish of the Day
        if (dishOfTheDay.title) {
            try {
                dishOfTheDay.base64Image = await generateDishImage(dishOfTheDay.title, 'Food Magazine');
            } catch (imgError) {
                console.error("Could not generate image for Dish of the Day:", imgError);
                dishOfTheDay.base64Image = undefined; // Ensure it's undefined on failure
            }
        }

        return { dishOfTheDay, cuisineSpotlight, techniqueOfTheWeek };
    } catch (error) {
        console.error("Error generating explore page content:", error);
        throw new Error("Could not load the Explore page right now. Please try again later.");
    }
}

export async function generateShoppingListFromPlan(plan: MealPlan, profile: UserProfile): Promise<string[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `Based on the following 7-day meal plan, generate a consolidated shopping list of all unique ingredients required. Exclude common pantry staples like salt, pepper, and oil unless they are a primary ingredient. ${buildProfilePrompt(profile)}\n\nMeal Plan:\n${JSON.stringify(plan, null, 2)}\n\nYour response must be ONLY a JSON array of strings.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } },
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        return parseJsonGracefully<string[]>(response.text.trim());
    } catch (error) {
        console.error("Error in generateShoppingListFromPlan:", { error, prompt });
        throw new Error("Cook AI couldn't generate a shopping list from this plan.");
    }
}

// --- New "Smart Tool" Functions ---

export async function getIngredientSubstitute(ingredient: string, recipeContext: string, profile: UserProfile): Promise<IngredientSubstitute[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `I need substitutes for "${ingredient}" in the recipe "${recipeContext}". Provide 3 distinct suggestions. For each, explain the new quantity needed and the impact on the final dish's flavor and texture. ${buildProfilePrompt(profile)}. Your response must be ONLY a JSON array of objects.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            ingredient: { type: Type.STRING },
                            substitute: { type: Type.STRING },
                            quantity: { type: Type.STRING },
                            impact: { type: Type.STRING }
                        },
                        required: ['ingredient', 'substitute', 'quantity', 'impact']
                    }
                },
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        return parseJsonGracefully<IngredientSubstitute[]>(response.text.trim());
    } catch (error) {
        console.error("Error in getIngredientSubstitute:", { error, prompt });
        throw new Error("Cook AI couldn't find any good substitutes right now.");
    }
}

export async function getBeveragePairing(recipe: Recipe, profile: UserProfile): Promise<BeveragePairings> {
    return getBeveragePairingForDish(`A dish titled "${recipe.title}", described as "${recipe.description}"`, profile);
}

export async function getBeveragePairingForDish(dishDescription: string, profile: UserProfile): Promise<BeveragePairings> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `Suggest beverage pairings for the following dish: "${dishDescription}". Provide 2 suggestions each for wine, beer, and non-alcoholic options. For each suggestion, provide a name and a brief reason for the pairing. ${buildProfilePrompt(profile)}. Your response must be ONLY a JSON object.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        wine: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, reason: { type: Type.STRING } }, required: ['name', 'reason'] } },
                        beer: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, reason: { type: Type.STRING } }, required: ['name', 'reason'] } },
                        nonAlcoholic: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, reason: { type: Type.STRING } }, required: ['name', 'reason'] } },
                    },
                    required: ['wine', 'beer', 'nonAlcoholic']
                },
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        return parseJsonGracefully<BeveragePairings>(response.text.trim());
    } catch (error) {
        console.error("Error in getBeveragePairingForDish:", { error, prompt });
        throw new Error("Cook AI had trouble finding the perfect drink pairing.");
    }
}

export async function scaleRecipe(recipe: Recipe, newServings: string, profile: UserProfile): Promise<Recipe> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `Scale the following recipe from "${recipe.servings}" to "${newServings}". Intelligently adjust all ingredient quantities. Keep instructions the same but add a note if cooking times might change. Return the entire recipe as a new JSON object. Original recipe:\n${JSON.stringify(recipe)}\n\n${buildProfilePrompt(profile)}. Your response must be ONLY a JSON object matching the recipe schema.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                responseSchema: recipeSchema,
                thinkingConfig: { thinkingBudget: 32768 }
            },
        });
        const scaledRecipe = parseJsonGracefully<Recipe>(response.text.trim());
        // Ensure the new servings size is correctly set in the response.
        scaledRecipe.servings = newServings;
        return scaledRecipe;
    } catch (error) {
        console.error("Error in scaleRecipe:", { error, prompt });
        throw new Error("Cook AI had trouble scaling this recipe. Please check the serving size.");
    }
}

export async function scaleIngredients(ingredients: string[], fromServings: string, toServings: string, profile: UserProfile): Promise<string[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `Scale the following list of ingredients from "${fromServings}" to "${toServings}". Intelligently adjust all ingredient quantities. ${buildProfilePrompt(profile)}. Your response must be ONLY a JSON array of strings with the new scaled ingredient list. \n\nIngredients:\n${ingredients.join('\n')}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } },
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        return parseJsonGracefully<string[]>(response.text.trim());
    } catch (error) {
        console.error("Error in scaleIngredients:", { error, prompt });
        throw new Error("Cook AI had trouble scaling these ingredients.");
    }
}

export async function getGarnishIdeas(dishDescription: string, profile: UserProfile): Promise<GarnishIdea[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `I need 2-3 creative garnish ideas for a dish: "${dishDescription}". For each idea, provide a name for the garnish, a list of ingredients, and brief instructions. ${buildProfilePrompt(profile)}. Your response must be ONLY a JSON array of objects.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            idea: { type: Type.STRING },
                            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                            instructions: { type: Type.STRING }
                        },
                        required: ['idea', 'ingredients', 'instructions']
                    }
                },
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        return parseJsonGracefully<GarnishIdea[]>(response.text.trim());
    } catch (error) {
        console.error("Error in getGarnishIdeas:", { error, prompt });
        throw new Error("Cook AI couldn't come up with any garnish ideas right now.");
    }
}

export async function getKitchenSafetyTip(topic: string, profile: UserProfile): Promise<KitchenSafetyTip> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `Provide a crucial kitchen safety tip related to "${topic}". The response should include a concise "tip" and a more detailed "explanation" of why it's important. ${buildProfilePrompt(profile)}. Your response must be ONLY a JSON object.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        tip: { type: Type.STRING },
                        explanation: { type: Type.STRING }
                    },
                    required: ['tip', 'explanation']
                },
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        return parseJsonGracefully<KitchenSafetyTip>(response.text.trim());
    } catch (error) {
        console.error("Error in getKitchenSafetyTip:", { error, prompt });
        throw new Error("Cook AI couldn't provide a safety tip on this topic right now.");
    }
}

export async function getHealthInsight(simulatedData: object, profile: UserProfile): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `You are a health-conscious AI cooking assistant. Your tone should be encouraging, non-judgmental, and actionable. Based on the following simulated user data for today and their personal nutrition goals, provide a single, personalized insight for their dinner planning. Your insight must not sound generic; it must directly reference their data and goals. Explain your reasoning clearly. Keep it concise (2-3 sentences).
    
    User's Nutrition Goals:
    - Calories: ~${profile.nutritionGoals.calories || 'Not set'} kcal
    - Protein: ~${profile.nutritionGoals.protein || 'Not set'} g
    - Carbs: ~${profile.nutritionGoals.carbs || 'Not set'} g
    - Fat: ~${profile.nutritionGoals.fat || 'Not set'} g

    Simulated Data: ${JSON.stringify(simulatedData, null, 2)}
    
    Example of a good response: "You've had a great activity day! For dinner, a lean protein source like grilled fish with roasted vegetables would be perfect to help you meet your ${profile.nutritionGoals.protein}g protein goal while staying within your calorie target."

    Your entire response should be ONLY the text of the insight.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error in getHealthInsight:", { error, prompt });
        throw new Error("Could not generate a health insight at this time.");
    }
}

export async function getInitialSuggestions(profile: UserProfile): Promise<{text: string; prompt: string}[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const profilePrompt = buildProfilePrompt(profile);
    const prompt = `Based on the user's profile, generate 3 creative and varied recipe suggestions for the app's initial screen. For each suggestion, provide a short, engaging 'text' (e.g., "A spicy Thai green curry") and a slightly more detailed 'prompt' to generate the recipe (e.g., "recipe for a spicy vegan Thai green curry"). ${profilePrompt}. Your response must be ONLY a JSON array of objects.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            text: { type: Type.STRING },
                            prompt: { type: Type.STRING }
                        },
                        required: ['text', 'prompt']
                    }
                },
            },
        });
        return parseJsonGracefully<{text: string; prompt: string}[]>(response.text.trim());
    } catch (error) {
        console.error("Error in getInitialSuggestions:", { error, prompt });
        // Return static fallbacks on error
        return [
            { text: "Healthy dinner for two", prompt: "Healthy dinner for two" },
            { text: "Quick 30-minute lunch idea", prompt: "Quick 30-minute lunch idea" },
            { text: "Show me a vegan pasta recipe", prompt: "Show me a vegan pasta recipe" },
        ];
    }
}