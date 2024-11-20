import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface TreeTimelineProps {
  videoId: string;
  onSeek: (timestamp: number) => void;
}

interface TranscriptSegment {
  text: string;
  timestamp: number;
  isHighlight?: boolean;
  highlightReason?: string;
  importance?: 'low' | 'medium' | 'high' | 'critical';
}

export const TreeTimeline: React.FC<TreeTimelineProps> = ({ videoId, onSeek }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [highlights, setHighlights] = useState<TranscriptSegment[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  useEffect(() => {
    if (!videoId) return;

    console.log('[Socket] Creating new socket connection');
    const newSocket = io('http://localhost:3001', {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 45000,
      transports: ['polling', 'websocket'], // Try polling first
      withCredentials: true,
      forceNew: true,
      autoConnect: false // Don't connect automatically
    });

    // Setup event handlers before connecting
    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
      setError(`Connection error: ${error.message}`);
      setIsConnected(false);
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected successfully');
      setIsConnected(true);
      setError(null);
    });

    // Now connect
    console.log('[Socket] Attempting connection...');
    newSocket.connect();

    setSocket(newSocket);
    setSegments([]);
    setHighlights([]);
    setError(null);

    return () => {
      console.log('[Socket] Cleaning up socket connection');
      if (newSocket) {
        newSocket.removeAllListeners();
        newSocket.close();
      }
    };
  }, [videoId]);

  useEffect(() => {
    if (!socket || !videoId) return;

    console.log('[Socket] Setting up socket listeners for video:', videoId);

    const handleConnect = () => {
      console.log('[Socket] Connected, requesting transcript for:', videoId);
      setIsConnected(true);
      setError(null);
      socket.emit('join_session', { videoId });
    };

    const handleConnectError = (error: Error) => {
      console.error('[Socket] Connection error:', error);
      setError(`Connection error: ${error.message}`);
      setIsConnected(false);
    };

    const handleTranscriptSegments = (segments: TranscriptSegment[]) => {
      console.log('[Socket] Received transcript segments:', segments.length);
      if (segments.length > 0) {
        console.log('[Socket] First segment:', segments[0]);
        setSegments(segments);
        setError(null);
      } else {
        setError('No transcript segments received');
      }
    };

    const handleHighlight = (segment: TranscriptSegment) => {
      console.log('[Socket] Received highlight:', segment);
      setHighlights(prev => {
        if (prev.some(h => h.timestamp === segment.timestamp)) {
          return prev;
        }
        return [...prev, segment];
      });
    };

    const handleAnalysisComplete = (data: { totalProcessed: number; highlights: TranscriptSegment[] }) => {
      console.log('[Socket] Analysis complete:', data);
      setHighlights(data.highlights);
      setAnalysisComplete(true);
    };

    const handleError = (error: { message: string }) => {
      console.error('[Socket] Error:', error);
      setError(error.message);
    };

    const handleDisconnect = () => {
      console.log('[Socket] Disconnected');
      setIsConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
    socket.on('transcript_segments', handleTranscriptSegments);
    socket.on('highlight_found', handleHighlight);
    socket.on('analysis_complete', handleAnalysisComplete);
    socket.on('error', handleError);
    socket.on('disconnect', handleDisconnect);

    // If already connected, request transcript
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      console.log('[Socket] Cleaning up socket listeners');
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.off('transcript_segments', handleTranscriptSegments);
      socket.off('highlight_found', handleHighlight);
      socket.off('analysis_complete', handleAnalysisComplete);
      socket.off('error', handleError);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket, videoId]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getImportanceColor = (importance?: string) => {
    switch (importance) {
      case 'low':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'high':
        return 'bg-orange-500';
      case 'critical':
        return 'bg-pink-600';
      default:
        return 'bg-gray-500';
    }
  };

  const getImportanceStyle = (importance?: string) => {
    const baseStyle = 'rounded px-2 py-1 text-xs font-semibold text-white mr-2';
    return `${baseStyle} ${getImportanceColor(importance)}`;
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-gray-800 p-4">
      {/* Connection Status */}
      <div className="text-white/70 text-sm mb-4">
        {!isConnected ? (
          <div>Connecting...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div>Connected</div>
        )}
      </div>

      {/* Full Timeline Section */}
      {segments.length > 0 ? (
        <div className="space-y-4">
          {/* Highlights Section */}
          {highlights.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white text-lg font-semibold mb-3">Key Moments</h3>
              <div className="space-y-2">
                {highlights.map((segment, index) => (
                  <div
                    key={`highlight-${index}`}
                    onClick={() => onSeek(segment.timestamp)}
                    className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg cursor-pointer transition-all duration-200"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={getImportanceStyle(segment.importance)}>
                          {segment.importance?.toUpperCase() || 'HIGHLIGHT'}
                        </span>
                        <span className="text-white/80 text-sm">
                          {formatTime(segment.timestamp)}
                        </span>
                      </div>
                      {segment.highlightReason && (
                        <div className="text-white/60 text-sm mb-2">
                          {segment.highlightReason}
                        </div>
                      )}
                      <div className="text-white">{segment.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Transcript */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-3">Full Transcript</h3>
            <div className="space-y-2">
              {segments.map((segment, index) => (
                <div
                  key={`segment-${index}`}
                  onClick={() => onSeek(segment.timestamp)}
                  className={`p-3 rounded cursor-pointer transition-all duration-200 ${
                    segment.isHighlight 
                      ? 'bg-gray-700/80 hover:bg-gray-600/80' 
                      : 'bg-gray-700/40 hover:bg-gray-600/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-white/50 text-sm whitespace-nowrap">
                      {formatTime(segment.timestamp)}
                    </span>
                    <span className="text-white flex-1">
                      {segment.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-white/50 text-center py-8">
          Loading transcript...
        </div>
      )}
    </div>
  );
};
