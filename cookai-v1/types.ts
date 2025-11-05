import React from 'react';

export type Language = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'hi' | 'zh' | 'ar' | 'ru' | 'pt' | 'bn' | 'id';

export interface FlavorProfileData {
  sweet: number;
  spicy: number;
  salty: number;
  sour: number;
  bitter: number;
  umami: number;
}

export interface Recipe {
  title: string;
  description: string;
  cookingTime: string;
  prepTime?: string;
  cuisine?: string;
  tags?: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  servings: string;
  ingredients: string[];
  instructions: string[];
  flavorProfile?: FlavorProfileData;
  foodLore?: string; // New: A fun fact or story about the recipe.
  isSaved?: boolean;
  isFavorite?: boolean;
  rating?: number;
  base64Image?: string;
}

export interface RecipeVariant {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime?: string;
  cuisine?: string;
  tags?: string[];
}

// Replaced VideoTutorial with a more generic Tutorial interface
export interface Tutorial {
  source: string;
  title: string;
  description: string;
  url: string;
}

export interface ImageAnalysisInventoryItem {
  name: string;
  quantity: string;
  quality: string;
}

export interface ImageAnalysisResult {
    inventory: ImageAnalysisInventoryItem[];
    qualityNotes: string;
    recipes: Recipe[];
    suggestedAdditions: string[];
    nutritionalSummary: string;
    healthScore: {
        score: number; // A number from 0 to 100
        reasoning: string;
    };
    storageTips: string[];
    chefTips: string[];
}


export interface Message {
  role: 'user' | 'model' | 'system' | 'tool';
  content: string; // Content is now always a string for serialization
  type: 'text' | 'recipe' | 'variations' | 'image-suggestions' | 'fused-recipe' | 'tutorials' | 'loading' | 'grounded-response' | 'image-query' | 'smart-tool-result';
  data?: any; // Complex data like recipe objects or variations are stored here
}

export interface SavedChat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

export interface GroundingChunk {
  web?: { uri: string; title: string; };
  maps?: { uri: string; title: string; placeAnswerSources?: { reviewSnippets: { uri: string; text: string; }[]; } }
}

export interface ConversionResult {
  quantity: number;
  unit: string;
}

export type PantryCategory = 'Grains' | 'Meat' | 'Vegetables' | 'Fruits' | 'Dairy' | 'Spices' | 'Other';
export const PANTRY_CATEGORIES: PantryCategory[] = ['Grains', 'Meat', 'Vegetables', 'Fruits', 'Dairy', 'Spices', 'Other'];

export interface PantryItem {
  name: string;
  category: PantryCategory;
  quantity: string;
  addedDate: string; // ISO String for date tracking
  expiryDate?: string; // Optional ISO string for expiry
}

export interface MealPlan {
  [day: string]: { breakfast?: string; lunch?: string; dinner?: string; };
}

export interface SavedMealPlans {
  [planName: string]: MealPlan;
}

export interface ShoppingListItem {
  id: number;
  text: string;
  completed: boolean;
  category: string; // e.g., 'Produce', 'Dairy', 'General'
}

export interface RememberedPerson {
  id: string;
  name: string;
  details: string;
}

export interface UserProfile {
  name: string;
  dietaryRestrictions: string[];
  allergies: string[]; // For strict allergy filtering
  dislikedIngredients: string[]; // For preference-based filtering
  tastePreferences: string[];
  budgetMode: boolean;
  pantry: PantryItem[];
  language: Language;
  rememberedPeople: RememberedPerson[];
  healthIntegrations: {
    googleFitConnected: boolean;
    appleHealthConnected: boolean;
  };
  nutritionGoals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  privacySettings: {
    saveChatHistory: boolean;
    allowPersonalization: boolean;
  };
  // New fields for hyper-personalization
  skillLevel: 'Beginner' | 'Intermediate' | 'Expert';
  availableEquipment: string[];
  favoriteCuisines: string[];
  cookingGoals: string[]; // e.g., "Learn new techniques", "Eat healthier"
  notificationSettings: {
    dailyShoppingListReminder: boolean;
    dailyMealPlanReminder: boolean;
    expiringItemReminder: boolean; // For pantry alerts
    reminderTime: string; // e.g., "17:00"
  };
  // New fields for gamification and personalization
  cookingStreak: number;
  lastCookedDate: string; // ISO date string: "YYYY-MM-DD"
  pantryHistory: { name: string; addedAt: string; }[];
  achievements: string[]; // For gamification
}

export type ActivePage = 'chat' | 'food-news' | 'explore' | 'meal-planner' | 'shopping-list' | 'assistant' | 'smart-tools' | 'cooking' | 'capabilities' | 'food-recognition';

// Types for the new Explore page
export interface ExploreCard {
  title: string;
  description: string;
  prompt: string;
  base64Image?: string;
}

export interface ExploreCuisine {
    name: string;
    description: string;
    recipes: {
        name: string;
        prompt: string;
    }[];
}

export interface ExploreTechnique {
    name: string;
    description: string;
}

export interface ExplorePageContent {
  dishOfTheDay: ExploreCard;
  cuisineSpotlight: ExploreCuisine;
  techniqueOfTheWeek: ExploreTechnique;
}

// Type for the redesigned Food News feature
export interface FoodNewsItem {
  title: string;
  summary: string;
  source?: { 
    uri: string;
    title: string;
  };
}

// Types for new "Smart Tools"
export interface IngredientSubstitute {
  ingredient: string;
  substitute: string;
  quantity: string;
  impact: string; // Describes the impact on flavor/texture
}

export interface BeveragePairings {
    wine: { name: string; reason: string; }[];
    beer: { name: string; reason: string; }[];
    nonAlcoholic: { name: string; reason: string; }[];
}

export interface GarnishIdea {
    idea: string;
    ingredients: string[];
    instructions: string;
}

export interface KitchenSafetyTip {
    tip: string;
    explanation: string;
}