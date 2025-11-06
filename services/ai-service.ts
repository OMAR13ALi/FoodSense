/**
 * AI Service - Nutrition Analysis
 * Handles communication with OpenRouter (Gemini) and Perplexity Sonar APIs
 */

import axios, { AxiosError } from 'axios';
import config, { getCurrentProviderConfig } from '@/config/env';
import { AIAnalysisResult, APIError } from '@/types';

// System prompt for nutrition analysis
const NUTRITION_PROMPT = `You are a nutrition analysis assistant. When given a meal description, analyze and return the nutritional information in the following JSON format:

{
  "calories": <number>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fat": <number in grams>,
  "explanation": "<detailed explanation of how you calculated these values, including sources>",
  "confidence": <0-1 number indicating confidence>,
  "sources": ["<source1>", "<source2>"]
}

Be as accurate as possible. If the description is vague, make reasonable assumptions and explain them in the explanation field. Consider standard portion sizes unless specified otherwise.`;

/**
 * Analyzes meal text using AI to extract nutrition information
 */
export async function analyzeNutrition(
  mealText: string
): Promise<AIAnalysisResult> {
  if (!mealText || mealText.trim().length === 0) {
    throw createAPIError('Meal text cannot be empty', 'EMPTY_INPUT', false);
  }

  const providerConfig = getCurrentProviderConfig();

  try {
    if (providerConfig.provider === 'openrouter') {
      return await analyzeWithOpenRouter(mealText, providerConfig);
    } else {
      return await analyzeWithPerplexity(mealText, providerConfig);
    }
  } catch (error) {
    if (config.debugMode) {
      console.error('AI Analysis Error:', error);
    }
    throw handleAPIError(error);
  }
}

/**
 * OpenRouter (Gemini) implementation
 */
async function analyzeWithOpenRouter(
  mealText: string,
  providerConfig: ReturnType<typeof getCurrentProviderConfig>
): Promise<AIAnalysisResult> {
  const response = await axios.post(
    `${providerConfig.baseURL}/chat/completions`,
    {
      model: providerConfig.model,
      messages: [
        {
          role: 'system',
          content: NUTRITION_PROMPT,
        },
        {
          role: 'user',
          content: `Analyze the nutritional content of: "${mealText}"`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    },
    {
      headers: {
        Authorization: `Bearer ${providerConfig.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://calorie-tracker-app.com',
        'X-Title': 'Calorie Tracker',
      },
      timeout: 30000,
    }
  );

  const content = response.data.choices[0]?.message?.content;
  if (!content) {
    throw createAPIError(
      'No response from AI',
      'EMPTY_RESPONSE',
      true
    );
  }

  return parseAIResponse(content);
}

/**
 * Perplexity Sonar implementation
 */
async function analyzeWithPerplexity(
  mealText: string,
  providerConfig: ReturnType<typeof getCurrentProviderConfig>
): Promise<AIAnalysisResult> {
  const response = await axios.post(
    `${providerConfig.baseURL}/chat/completions`,
    {
      model: providerConfig.model,
      messages: [
        {
          role: 'system',
          content: NUTRITION_PROMPT,
        },
        {
          role: 'user',
          content: `Analyze the nutritional content of: "${mealText}". Search for accurate nutrition data from reliable sources.`,
        },
      ],
      temperature: 0.3,
      return_citations: true,
    },
    {
      headers: {
        Authorization: `Bearer ${providerConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  const content = response.data.choices[0]?.message?.content;
  if (!content) {
    throw createAPIError(
      'No response from AI',
      'EMPTY_RESPONSE',
      true
    );
  }

  // Extract citations from Perplexity response
  const citations = response.data.citations || [];

  const result = parseAIResponse(content);

  // Add citations to sources if not already present
  if (citations.length > 0 && (!result.sources || result.sources.length === 0)) {
    result.sources = citations;
  }

  return result;
}

/**
 * Parse AI response JSON
 */
function parseAIResponse(content: string): AIAnalysisResult {
  try {
    const parsed = JSON.parse(content);

    // Validate required fields
    if (
      typeof parsed.calories !== 'number' ||
      typeof parsed.protein !== 'number' ||
      typeof parsed.carbs !== 'number' ||
      typeof parsed.fat !== 'number'
    ) {
      throw new Error('Invalid nutrition data format');
    }

    return {
      calories: Math.round(parsed.calories),
      protein: Math.round(parsed.protein),
      carbs: Math.round(parsed.carbs),
      fat: Math.round(parsed.fat),
      explanation: parsed.explanation || 'No explanation provided',
      confidence: parsed.confidence || 0.8,
      sources: parsed.sources || [],
    };
  } catch (error) {
    // Fallback: Try to extract numbers from text if JSON parsing fails
    return extractNutritionFromText(content);
  }
}

/**
 * Fallback: Extract nutrition info from plain text response
 */
function extractNutritionFromText(text: string): AIAnalysisResult {
  const calorieMatch = text.match(/(\d+)\s*(?:cal|kcal|calories)/i);
  const proteinMatch = text.match(/(\d+)\s*(?:g|grams?)?\s*(?:of\s+)?protein/i);
  const carbsMatch = text.match(/(\d+)\s*(?:g|grams?)?\s*(?:of\s+)?carb/i);
  const fatMatch = text.match(/(\d+)\s*(?:g|grams?)?\s*(?:of\s+)?fat/i);

  if (!calorieMatch) {
    throw createAPIError(
      'Could not extract calorie information from AI response',
      'PARSE_ERROR',
      false
    );
  }

  return {
    calories: parseInt(calorieMatch[1], 10),
    protein: proteinMatch ? parseInt(proteinMatch[1], 10) : 20,
    carbs: carbsMatch ? parseInt(carbsMatch[1], 10) : 30,
    fat: fatMatch ? parseInt(fatMatch[1], 10) : 10,
    explanation: text.substring(0, 500), // First 500 chars as explanation
    confidence: 0.6, // Lower confidence for parsed text
    sources: [],
  };
}

/**
 * Handle API errors and convert to APIError type
 */
function handleAPIError(error: unknown): APIError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    // Network errors
    if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
      return createAPIError(
        'Request timed out. Please check your connection.',
        'TIMEOUT',
        true
      );
    }

    if (!axiosError.response) {
      return createAPIError(
        'Network error. Please check your internet connection.',
        'NETWORK_ERROR',
        true
      );
    }

    // API errors
    const status = axiosError.response.status;
    if (status === 401) {
      return createAPIError(
        'Invalid API key. Please check your configuration.',
        'AUTH_ERROR',
        false
      );
    }

    if (status === 429) {
      return createAPIError(
        'Rate limit exceeded. Please wait a moment.',
        'RATE_LIMIT',
        true
      );
    }

    if (status >= 500) {
      return createAPIError(
        'AI service is temporarily unavailable.',
        'SERVER_ERROR',
        true
      );
    }

    return createAPIError(
      `API error: ${axiosError.message}`,
      'API_ERROR',
      true
    );
  }

  if (error instanceof Error) {
    return createAPIError(error.message, 'UNKNOWN_ERROR', false);
  }

  return createAPIError(
    'An unexpected error occurred',
    'UNKNOWN_ERROR',
    false
  );
}

/**
 * Create standardized API error
 */
function createAPIError(
  message: string,
  code: string,
  retryable: boolean
): APIError {
  return {
    message,
    code,
    retryable,
  };
}

/**
 * Debounced nutrition analysis
 * Returns a function that debounces calls to analyzeNutrition
 */
export function createDebouncedAnalyzer(delayMs: number = 800) {
  let timeoutId: NodeJS.Timeout | null = null;
  let currentController: AbortController | null = null;

  return async (mealText: string): Promise<AIAnalysisResult> => {
    // Clear previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Abort previous request
    if (currentController) {
      currentController.abort();
    }

    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        currentController = new AbortController();
        try {
          const result = await analyzeNutrition(mealText);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delayMs);
    });
  };
}
