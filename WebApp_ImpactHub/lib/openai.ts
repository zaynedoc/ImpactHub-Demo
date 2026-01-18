/**
 * OpenAI client utility for server-side AI interactions
 * Uses the OpenAI Responses API for plan generation
 * 
 * SECURITY: This file should only be imported in server-side code (API routes)
 * Never expose the API key to the client.
 */

import OpenAI from 'openai';

// Validate environment variable exists
if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not set. AI features will not work.');
}

// Create OpenAI client instance (singleton)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Default model to use
export const DEFAULT_MODEL = 'gpt-4o-mini';

// Token limits for cost control
export const TOKEN_LIMITS = {
  maxInputTokens: 1000,  // Limit user prompt context
  maxOutputTokens: 2000, // Limit AI response length
};

/**
 * Input for generating a workout plan
 */
export interface PlanGenerationInput {
  goal: 'strength' | 'hypertrophy' | 'endurance' | 'weight_loss' | 'general_fitness';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek: 2 | 3 | 4 | 5 | 6;
  equipment: 'full_gym' | 'home_basic' | 'bodyweight_only' | 'dumbbells_only';
  focusAreas?: string[]; // e.g., ['chest', 'back', 'legs']
  limitations?: string;   // Any injuries or limitations
}

/**
 * Generated workout plan structure
 */
export interface GeneratedPlan {
  name: string;
  description: string;
  weeks: number;
  daysPerWeek: number;
  workouts: GeneratedWorkout[];
}

export interface GeneratedWorkout {
  day: number;
  name: string;
  focus: string;
  exercises: GeneratedExercise[];
}

export interface GeneratedExercise {
  name: string;
  sets: number;
  reps: string;  // e.g., "8-12" or "15"
  restSeconds: number;
  notes?: string;
}

/**
 * Generate a personalized workout plan using OpenAI
 * 
 * @param input - User's training preferences and goals
 * @returns Generated plan with token usage info
 */
export async function generateWorkoutPlan(input: PlanGenerationInput): Promise<{
  plan: GeneratedPlan;
  tokensIn: number;
  tokensOut: number;
  model: string;
}> {
  // Check for API key before making request
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured. Please add it to your .env.local file.');
  }

  const systemPrompt = `You are an expert fitness coach and exercise scientist. Generate personalized, safe, and effective workout programs based on user goals and constraints.

RULES:
1. Only suggest exercises appropriate for the user's equipment and experience level
2. Include proper warm-up notes for each workout
3. Balance muscle groups throughout the week
4. Provide rep ranges, not exact numbers (e.g., "8-12" not "10")
5. Include rest periods between sets
6. For beginners, prioritize compound movements and proper form
7. For advanced users, include periodization concepts
8. Always prioritize safety - never suggest exercises that could cause injury

Respond ONLY with valid JSON matching the specified schema. No markdown, no explanation.`;

  const userPrompt = buildUserPrompt(input);

  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: TOKEN_LIMITS.maxOutputTokens,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let plan: GeneratedPlan;
    try {
      plan = JSON.parse(content) as GeneratedPlan;
    } catch {
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate basic structure
    if (!plan.name || !plan.workouts || !Array.isArray(plan.workouts)) {
      throw new Error('Invalid plan structure returned by AI');
    }

    return {
      plan,
      tokensIn: response.usage?.prompt_tokens || 0,
      tokensOut: response.usage?.completion_tokens || 0,
      model: DEFAULT_MODEL,
    };
  } catch (error) {
    // Re-throw with more context for debugging
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw error;
      }
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    throw new Error('Unknown error occurred while generating plan');
  }
}

/**
 * Build the user prompt from input parameters
 */
function buildUserPrompt(input: PlanGenerationInput): string {
  const goalDescriptions: Record<PlanGenerationInput['goal'], string> = {
    strength: 'building maximum strength with heavy compound lifts',
    hypertrophy: 'building muscle size with moderate weights and volume',
    endurance: 'improving muscular endurance with lighter weights and higher reps',
    weight_loss: 'fat loss while preserving muscle with circuit-style training',
    general_fitness: 'overall fitness improvement with balanced training',
  };

  const equipmentDescriptions: Record<PlanGenerationInput['equipment'], string> = {
    full_gym: 'full commercial gym with all equipment (barbells, dumbbells, cables, machines)',
    home_basic: 'home gym with adjustable dumbbells, pull-up bar, and bench',
    bodyweight_only: 'bodyweight exercises only, no equipment',
    dumbbells_only: 'dumbbells only (adjustable or fixed weight set)',
  };

  let prompt = `Create a ${input.daysPerWeek}-day per week workout program for a ${input.experienceLevel} trainee.

GOAL: ${goalDescriptions[input.goal]}
EQUIPMENT: ${equipmentDescriptions[input.equipment]}
EXPERIENCE: ${input.experienceLevel}
DAYS PER WEEK: ${input.daysPerWeek}`;

  if (input.focusAreas && input.focusAreas.length > 0) {
    prompt += `\nFOCUS AREAS: ${input.focusAreas.join(', ')}`;
  }

  if (input.limitations) {
    prompt += `\nLIMITATIONS/INJURIES: ${input.limitations}`;
  }

  prompt += `

Generate a 4-week program. Return JSON in this exact format:
{
  "name": "Program Name",
  "description": "Brief description of the program",
  "weeks": 4,
  "daysPerWeek": ${input.daysPerWeek},
  "workouts": [
    {
      "day": 1,
      "name": "Day Name (e.g., Upper Body A)",
      "focus": "Primary muscle groups",
      "exercises": [
        {
          "name": "Exercise Name",
          "sets": 3,
          "reps": "8-12",
          "restSeconds": 90,
          "notes": "Optional form tips or variations"
        }
      ]
    }
  ]
}

Include ${input.daysPerWeek} workout days in the workouts array.`;

  return prompt;
}

/**
 * Summarize user input for storage (sanitized)
 */
export function summarizeInput(input: PlanGenerationInput): string {
  const parts = [
    input.goal.replace('_', ' '),
    input.experienceLevel,
    `${input.daysPerWeek}x/week`,
    input.equipment.replace('_', ' '),
  ];
  
  if (input.focusAreas && input.focusAreas.length > 0) {
    parts.push(`focus: ${input.focusAreas.slice(0, 3).join(', ')}`);
  }
  
  return parts.join(' | ').slice(0, 500); // Respect DB constraint
}

export default openai;
