import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { config } from 'dotenv';
import cors from 'cors';
import { YoutubeTranscript } from 'youtube-transcript';
import { google } from 'googleapis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.resolve(__dirname, '../.env') });

// Verify environment variables
const requiredEnvVars = ['GEMINI_API_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const app = express();
const httpServer = createServer(app);

// Configure CORS
const corsOptions = {
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));

// Initialize Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  allowEIO3: true,
  transports: ['polling', 'websocket'], // Try polling first
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  maxHttpBufferSize: 1e8 // 100 MB
});

// Add connection logging
io.engine.on("connection_error", (err) => {
  console.error('[Socket.IO] Connection error:', err);
});

io.engine.on("headers", (headers: any, req: any) => {
  console.log('[Socket.IO] Headers set for connection');
});

// Add basic route handler
app.get('/', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    socketio: io ? 'initialized' : 'not initialized',
    cors: 'enabled',
    origins: corsOptions.origin
  });
});

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Types
interface TranscriptResponse {
  text: string;
  offset: number;  // Time in seconds from YouTube API
  duration: number;
}

interface TranscriptSegment {
  text: string;
  timestamp: number;  // Time in milliseconds
  isHighlight?: boolean;
  highlightReason?: string;
  importance?: 'low' | 'medium' | 'high' | 'critical';
}

interface VideoSession {
  videoId: string;
  segments: TranscriptSegment[];
  lastUpdated: number;
  highlights?: TranscriptSegment[];
}

interface ApiError extends Error {
  status?: number;
}

// Session management
class SessionManager {
  private static instance: SessionManager;
  public sessions: Map<string, VideoSession>;

  private constructor() {
    this.sessions = new Map();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  public async getSession(videoId: string): Promise<VideoSession | undefined> {
    return this.sessions.get(videoId);
  }

  public async initializeSession(videoId: string): Promise<VideoSession | undefined> {
    try {
      // Get raw transcript first
      const segments = await getTranscript(videoId);
      
      const session: VideoSession = {
        videoId,
        segments,
        lastUpdated: Date.now(),
        highlights: []
      };

      this.sessions.set(videoId, session);
      return session;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error initializing session:', error.message);
      } else {
        console.error('Unknown error initializing session');
      }
      throw error; // Propagate error to caller
    }
  }
}

async function getTranscript(videoId: string): Promise<TranscriptSegment[]> {
  try {
    console.log('Fetching raw transcript for video:', videoId);
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcript || transcript.length === 0) {
      throw new Error('No transcript available');
    }
    
    return transcript.map((item: TranscriptResponse) => ({
      text: item.text,
      timestamp: item.offset * 1000, // Convert to milliseconds
      isHighlight: false,
      importance: undefined,
      highlightReason: undefined
    }));
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw error;
  }
}

// YouTube transcript fetching
async function fetchTranscript(videoId: string): Promise<TranscriptSegment[]> {
  try {
    console.log('[Transcript] Starting fetch for video:', videoId);
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcript || transcript.length === 0) {
      console.error('[Transcript] No transcript available for video:', videoId);
      throw new Error('No transcript available for this video');
    }

    console.log(`[Transcript] Successfully fetched ${transcript.length} segments`);
    const segments = transcript.map((item: TranscriptResponse, index) => {
      const segment = {
        text: item.text,
        timestamp: item.offset * 1000, // Convert to milliseconds
        isHighlight: false,
        importance: undefined,
        highlightReason: undefined
      };
      if (index === 0) console.log('[Transcript] First segment:', segment);
      return segment;
    });

    return segments;
  } catch (error) {
    console.error('[Transcript] Error fetching:', error);
    throw error;
  }
}

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 10,
  BATCH_SIZE: 3,
  BATCH_DELAY_MS: 6000, // 6 seconds between batches
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 1000
};

let requestCount = 0;
let lastResetTime = Date.now();

function resetRateLimit() {
  requestCount = 0;
  lastResetTime = Date.now();
}

// Reset rate limit counter every minute
setInterval(resetRateLimit, 60000);

async function processTranscriptBatch(
  socket: any,
  segments: TranscriptSegment[],
  startIndex: number
): Promise<void> {
  const batchSize = RATE_LIMIT.BATCH_SIZE;
  const endIndex = Math.min(startIndex + batchSize, segments.length);
  const batch = segments.slice(startIndex, endIndex);
  
  try {
    // Process segments sequentially within the batch
    for (const segment of batch) {
      try {
        const result = await analyzeTranscriptSegment(segment);
        if (result.isHighlight) {
          socket.emit('highlight_found', result);
        }
        
        // Update progress
        socket.emit('analysis_progress', {
          processed: startIndex + batch.indexOf(segment) + 1,
          total: segments.length
        });
        
        // Add delay between requests within batch
        await sleep(1000);
      } catch (error) {
        console.error('Error processing segment:', error);
        // Continue with next segment even if one fails
      }
    }
    
    // If there are more segments to process
    if (endIndex < segments.length) {
      // Add delay between batches
      await sleep(RATE_LIMIT.BATCH_DELAY_MS);
      await processTranscriptBatch(socket, segments, endIndex);
    } else {
      // All segments processed
      socket.emit('analysis_complete', {
        totalProcessed: segments.length,
        highlights: segments.filter(s => s.isHighlight)
      });
    }
  } catch (error) {
    console.error('Batch processing error:', error);
    socket.emit('analysis_error', { 
      message: 'Analysis partially completed',
      processed: startIndex
    });
  }
}

async function analyzeTranscriptSegment(
  segment: TranscriptSegment, 
  retryCount = 0
): Promise<TranscriptSegment> {
  try {
    if (retryCount >= 3) {
      throw new Error('Max retry attempts reached');
    }

    if (!checkRateLimit()) {
      await sleep(RATE_LIMIT.BASE_DELAY_MS);
    }

    incrementRateLimit();

    const prompt = `Analyze this video transcript segment and determine its importance level (low, medium, high, critical) and provide a brief reason why. Format the response exactly as JSON: {"importance": "level", "reason": "explanation"}. Segment text: "${segment.text}"`;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    try {
      const analysis = JSON.parse(text);
      return {
        ...segment,
        isHighlight: true,
        importance: analysis.importance as 'low' | 'medium' | 'high' | 'critical',
        highlightReason: analysis.reason
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return {
        ...segment,
        isHighlight: false,
        importance: undefined,
        highlightReason: undefined
      };
    }
  } catch (error) {
    const apiError = error as ApiError;
    if (apiError.status === 429) {
      await sleep(Math.pow(2, retryCount + 1) * 1000);
      return analyzeTranscriptSegment(segment, retryCount + 1);
    }
    console.error('Error in AI analysis:', error);
    return {
      ...segment,
      isHighlight: false,
      importance: undefined,
      highlightReason: undefined
    };
  }
}

function checkRateLimit() {
  const now = Date.now();
  if (now - lastResetTime >= 60000) {
    resetRateLimit();
  }
  return requestCount < RATE_LIMIT.MAX_REQUESTS_PER_MINUTE;
}

function incrementRateLimit() {
  requestCount++;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('[Socket] Client connected');

  socket.on('join_session', async ({ videoId }) => {
    if (!videoId) {
      console.error('[Socket] No videoId provided');
      socket.emit('error', { message: 'No video ID provided' });
      return;
    }

    console.log('[Socket] Join session request for video:', videoId);
    
    try {
      // First, try to get existing session
      let session = await sessionManager.getSession(videoId);
      
      if (!session) {
        console.log('[Socket] No existing session, fetching new transcript...');
        try {
          const segments = await fetchTranscript(videoId);
          
          if (!segments || segments.length === 0) {
            throw new Error('No transcript segments returned');
          }

          session = {
            videoId,
            segments,
            lastUpdated: Date.now(),
            highlights: []
          };
          
          console.log(`[Socket] Creating new session with ${segments.length} segments`);
          sessionManager.sessions.set(videoId, session);
          console.log('[Socket] Session initialized');
        } catch (transcriptError) {
          console.error('[Socket] Transcript fetch error:', transcriptError);
          socket.emit('error', { 
            message: transcriptError instanceof Error ? transcriptError.message : 'Failed to load transcript'
          });
          return;
        }
      } else {
        console.log(`[Socket] Found existing session with ${session.segments.length} segments`);
      }

      if (!session || !session.segments || session.segments.length === 0) {
        console.error('[Socket] Invalid session state:', session);
        socket.emit('error', { message: 'Failed to initialize session properly' });
        return;
      }

      // Send transcript immediately
      console.log(`[Socket] Sending ${session.segments.length} transcript segments to client`);
      socket.emit('transcript_segments', session.segments);
      console.log('[Socket] Transcript sent to client');

      // Start AI analysis in background
      console.log('[Socket] Starting AI analysis in background');
      processTranscriptBatch(socket, session.segments, 0).catch(error => {
        console.error('[Socket] Background analysis error:', error);
        socket.emit('analysis_error', { 
          message: 'Some highlights may be unavailable due to AI rate limiting',
          error: error instanceof Error ? error.message : 'Analysis error'
        });
      });
      
    } catch (error) {
      console.error('[Socket] Session error:', error);
      socket.emit('error', { 
        message: error instanceof Error ? error.message : 'Failed to process request'
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Client disconnected');
  });
});

const sessionManager = SessionManager.getInstance();

// Start the server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
  console.log(`[Server] CORS enabled for all origins`);
  console.log(`[Server] Health check available at http://localhost:${PORT}/health`);
});

// Add error handler for the server
httpServer.on('error', (error) => {
  console.error('❌ Server error:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
