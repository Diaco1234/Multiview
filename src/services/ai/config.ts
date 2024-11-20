export const AI_CONFIG = {
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || '',
  YOUTUBE_API_KEY: import.meta.env.VITE_YOUTUBE_API_KEY || '',
  MODEL_NAME: 'gemini-pro',
  MAX_TOKENS: 1000,
  TEMPERATURE: 0.7,
  MAX_TRANSCRIPT_LENGTH: 10000,
  TRANSCRIPT_CHUNK_SIZE: 2000
};

export const ERROR_MESSAGES = {
  TRANSCRIPT_FETCH_FAILED: 'Failed to fetch video transcript',
  AI_RESPONSE_FAILED: 'Failed to generate AI response',
  INVALID_VIDEO_URL: 'Invalid video URL format',
  NO_TRANSCRIPT_AVAILABLE: 'No transcript available for this video'
};
