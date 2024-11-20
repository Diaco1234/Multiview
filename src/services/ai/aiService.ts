import { GoogleGenerativeAI } from '@google/generative-ai';
import { YoutubeTranscript } from 'youtube-transcript';
import { AI_CONFIG, ERROR_MESSAGES } from './config';

interface TranscriptionData {
  videoId: string;
  transcript: string;
  timestamp: number;
}

interface VideoContext {
  videoId: string;
  transcript: string;
  summary: string;
  keyPoints: string[];
  url?: string;
  isLiveTranscribing?: boolean;
}

interface VideoTranscriptResponse {
  transcript: string;
  language: string;
}

class AIService {
  private genAI: GoogleGenerativeAI;
  private videoContexts: Map<string, VideoContext>;
  private transcriptionBuffer: Map<string, TranscriptionData[]>;
  private cleanupFunctions: Map<string, () => void>;
  private speechRecognition: Map<string, SpeechRecognition>;
  private config: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(AI_CONFIG.GEMINI_API_KEY);
    this.videoContexts = new Map();
    this.transcriptionBuffer = new Map();
    this.cleanupFunctions = new Map();
    this.speechRecognition = new Map();
    this.config = AI_CONFIG;
  }

  private async fetchTranscriptFromYouTube(url: string): Promise<string | null> {
    try {
      console.log('Attempting to fetch transcript for URL:', url);
      const videoId = this.extractYouTubeVideoId(url);
      if (!videoId) {
        throw new Error('Could not extract video ID from URL');
      }
      console.log('Extracted video ID:', videoId);

      const response = await fetch(`http://localhost:3001/api/transcript/${videoId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch transcript: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.captions) {
        return null;
      }

      // Parse captions data and convert to text
      const captions = JSON.parse(data.captions);
      if (!captions || !captions.playerCaptionsTracklistRenderer) {
        return null;
      }

      const captionTracks = captions.playerCaptionsTracklistRenderer.captionTracks;
      if (!captionTracks || captionTracks.length === 0) {
        return null;
      }

      // Get the first available caption track (usually English)
      const captionTrack = captionTracks[0];
      const captionResponse = await fetch(captionTrack.baseUrl);
      const captionText = await captionResponse.text();

      // Convert caption XML to plain text
      const transcript = captionText
        .replace(/<[^>]*>/g, '')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return this.cleanTranscriptText(transcript);
    } catch (error) {
      console.error('Transcript fetch error:', error);
      return null;
    }
  }

  private setupLiveTranscription(videoId: string, audioElement: HTMLAudioElement): void {
    if (!window.SpeechRecognition && !(window as any).webkitSpeechRecognition) {
      console.error('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let context = this.videoContexts.get(videoId);
    if (!context) {
      context = {
        videoId,
        transcript: '',
        summary: '',
        keyPoints: [],
        isLiveTranscribing: true
      };
      this.videoContexts.set(videoId, context);
    }

    recognition.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0].transcript;
      
      if (lastResult.isFinal) {
        context!.transcript += ' ' + this.cleanTranscriptText(transcript);
        this.videoContexts.set(videoId, context!);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    this.speechRecognition.set(videoId, recognition);
    recognition.start();

    // Setup audio context to get audio from the video
    const audioContext = new AudioContext();
    const source = audioContext.createMediaElementSource(audioElement);
    const destination = audioContext.createMediaStreamDestination();
    source.connect(destination);
    source.connect(audioContext.destination); // Also connect to speakers

    // Store cleanup function
    this.cleanupFunctions.set(videoId, () => {
      recognition.stop();
      this.speechRecognition.delete(videoId);
      audioContext.close();
    });
  }

  private extractYouTubeVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }

  private cleanTranscriptText(text: string): string {
    return text
      .replace(/\[\w+\]/g, '')
      .replace(/>>|--|►/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async startVideoProcessing(videoId: string, url: string, audioElement?: HTMLAudioElement): Promise<void> {
    console.log('Starting video processing for:', { videoId, url });
    
    try {
      // Try to get YouTube captions first
      const transcript = await this.fetchTranscriptFromYouTube(url);
      
      if (transcript) {
        // If we got captions, use them
        const context: VideoContext = {
          videoId,
          transcript,
          summary: '',
          keyPoints: [],
          url,
          isLiveTranscribing: false
        };
        this.videoContexts.set(videoId, context);
      } else if (audioElement) {
        // If no captions and we have an audio element, try live transcription
        console.log('No captions available, starting live transcription');
        this.setupLiveTranscription(videoId, audioElement);
      } else {
        console.log('No captions available and no audio element provided');
        const context: VideoContext = {
          videoId,
          transcript: 'No transcript available.',
          summary: '',
          keyPoints: [],
          url,
          isLiveTranscribing: false
        };
        this.videoContexts.set(videoId, context);
      }
    } catch (error) {
      console.error('Error in video processing:', error);
    }
  }

  stopVideoProcessing(videoId: string): void {
    const cleanup = this.cleanupFunctions.get(videoId);
    if (cleanup) {
      cleanup();
      this.cleanupFunctions.delete(videoId);
    }
    
    const recognition = this.speechRecognition.get(videoId);
    if (recognition) {
      recognition.stop();
      this.speechRecognition.delete(videoId);
    }

    this.videoContexts.delete(videoId);
    this.transcriptionBuffer.delete(videoId);
  }

  async handleUserQuery(query: string, videoContextId: string): Promise<string> {
    try {
      const context = this.videoContexts.get(videoContextId);
      if (!context) {
        return 'No context found for this video. Please ensure the video is loaded.';
      }

      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      const prompt = `Based on this video transcript: "${context.transcript}"\n\nQuestion: ${query}\n\nPlease provide a concise answer:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error handling user query:', error);
      return 'Sorry, I encountered an error while processing your query. Please try again.';
    }
  }

  // Get transcript for a specific video
  getVideoTranscript(videoId: string): string {
    return this.videoContexts.get(videoId)?.transcript || '';
  }

  // Get recent transcriptions for a video
  getRecentTranscriptions(videoId: string): TranscriptionData[] {
    return this.transcriptionBuffer.get(videoId) || [];
  }
}

export const aiService = new AIService();
