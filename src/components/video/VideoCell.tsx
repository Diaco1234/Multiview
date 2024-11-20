import React, { useRef, useState, useEffect } from 'react';
import YouTube from 'react-youtube';
import { TreeTimeline } from './TreeTimeline';
import { VideoStream } from '../../types';

interface VideoCellProps {
  stream: VideoStream;
  onRemove: (id: string) => void;
  onSelect: () => void;
  dragHandleProps?: any;
  innerRef?: any;
  draggableProps?: any;
}

export const VideoCell: React.FC<VideoCellProps> = ({
  stream,
  onRemove,
  onSelect,
  dragHandleProps,
  innerRef,
  draggableProps
}) => {
  const playerRef = useRef<YouTube>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const extractedVideoId = stream.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];

  useEffect(() => {
    if (!extractedVideoId) {
      setError('Invalid YouTube URL');
    }
  }, [extractedVideoId]);

  const handleSeek = (timestamp: number) => {
    const player = playerRef.current?.getInternalPlayer();
    if (player) {
      const seconds = Math.floor(timestamp / 1000);
      player.seekTo(seconds);
    }
  };

  if (!extractedVideoId) {
    return <div className="text-red-500">Error: {error || 'Invalid YouTube URL'}</div>;
  }

  return (
    <div
      ref={innerRef}
      {...draggableProps}
      className="relative w-full bg-black/30 rounded-lg overflow-hidden flex flex-col"
      style={{ height: 'calc(100% - 32px)' }}
    >
      <div {...dragHandleProps} className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/50 to-transparent z-10">
        <button
          onClick={() => onRemove(stream.id)}
          className="absolute top-2 left-2 text-white/70 hover:text-white transition-colors"
        >
          ×
        </button>
        {stream.title && (
          <div className="absolute top-2 left-8 right-8 text-white/70 truncate">
            {stream.title}
          </div>
        )}
      </div>

      <div className="flex-1">
        <YouTube
          ref={playerRef}
          videoId={extractedVideoId}
          opts={{
            width: '100%',
            height: '100%',
            playerVars: {
              autoplay: 1,
              modestbranding: 1,
            },
          }}
          onStateChange={(event) => setIsPlaying(event.data === 1)}
          className="w-full h-full"
        />
      </div>

      <div className="h-32 bg-black/20">
        <TreeTimeline videoId={extractedVideoId} onSeek={handleSeek} />
      </div>
    </div>
  );
};