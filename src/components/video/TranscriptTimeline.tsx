import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

interface DetectedEvent {
  id: string;
  timestamp: number;
  description: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  category: 'announcement' | 'action' | 'topic_change' | 'key_point';
}

interface TranscriptTimelineProps {
  videoId: string;
  onSeek: (timestamp: number) => void;
  currentTime: number;
}

export const TranscriptTimeline: React.FC<TranscriptTimelineProps> = ({
  videoId,
  onSeek,
  currentTime,
}) => {
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [events, setEvents] = useState<DetectedEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('http://localhost:3001');
    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-video', videoId);
    });

    socket.on('transcript-initial', (data) => {
      setTranscript(data.segments);
    });

    socket.on('events', (newEvents: DetectedEvent[]) => {
      setEvents(prev => {
        const combined = [...prev, ...newEvents];
        return combined.sort((a, b) => a.timestamp - b.timestamp);
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [videoId]);

  // Update timeline scroll position based on current time
  useEffect(() => {
    if (timelineRef.current) {
      const timelineWidth = timelineRef.current.scrollWidth;
      const containerWidth = timelineRef.current.clientWidth;
      const videoDuration = transcript[transcript.length - 1]?.start || 0;
      const scrollPosition = (currentTime / videoDuration) * (timelineWidth - containerWidth);
      
      timelineRef.current.scrollLeft = scrollPosition;
    }
  }, [currentTime, transcript]);

  const getImportanceColor = (importance: DetectedEvent['importance']) => {
    switch (importance) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: DetectedEvent['category']) => {
    switch (category) {
      case 'announcement': return '📢';
      case 'action': return '🎯';
      case 'topic_change': return '📌';
      case 'key_point': return '💡';
      default: return '•';
    }
  };

  return (
    <div className="w-full h-32 bg-gray-900 rounded-lg overflow-hidden">
      {/* Connection status */}
      <div className={`h-1 ${isConnected ? 'bg-green-500' : 'bg-red-500'} transition-colors duration-300`} />
      
      {/* Timeline container */}
      <div 
        ref={timelineRef}
        className="w-full h-full overflow-x-auto overflow-y-hidden relative"
      >
        {/* Timeline track */}
        <div className="absolute inset-0 h-full min-w-full">
          {/* Current time indicator */}
          <div 
            className="absolute top-0 h-full w-0.5 bg-blue-500 z-20"
            style={{ left: `${(currentTime / (transcript[transcript.length - 1]?.start || 1)) * 100}%` }}
          />

          {/* Events */}
          {events.map((event) => (
            <div
              key={event.id}
              className={`absolute top-2 -translate-x-1/2 cursor-pointer group`}
              style={{ left: `${(event.timestamp / (transcript[transcript.length - 1]?.start || 1)) * 100}%` }}
              onClick={() => onSeek(event.timestamp)}
            >
              {/* Event marker */}
              <div className={`w-3 h-3 rounded-full ${getImportanceColor(event.importance)} relative`}>
                <span className="absolute -top-6 left-1/2 -translate-x-1/2">
                  {getCategoryIcon(event.category)}
                </span>
              </div>
              
              {/* Event tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                <p className="font-medium">{event.description}</p>
                <p className="text-xs text-gray-400">
                  {new Date(event.timestamp * 1000).toISOString().substr(11, 8)}
                </p>
              </div>
            </div>
          ))}

          {/* Transcript segments */}
          {transcript.map((segment, index) => (
            <div
              key={index}
              className="absolute bottom-0 h-12 border-r border-gray-700"
              style={{
                left: `${(segment.start / (transcript[transcript.length - 1]?.start || 1)) * 100}%`,
                width: `${(segment.duration / (transcript[transcript.length - 1]?.start || 1)) * 100}%`
              }}
              onClick={() => onSeek(segment.start)}
            >
              <div className="px-1 text-xs text-gray-400 truncate">
                {segment.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
