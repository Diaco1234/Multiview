import { useState } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import { VideoStream } from '../types';
import ControlPanel from '../components/video/ControlPanel';
import VideoGrid from '../components/video/VideoGrid';
import AIChat from '../components/ai/AIChat';
import { validateVideoUrl, getVideoUrls } from '../utils/validation';

const VideoApp = () => {
  const [streams, setStreams] = useState<VideoStream[]>([]);
  const [layout, setLayout] = useState<number>(4);
  const [url, setUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');

  const handleAddStream = () => {
    if (!validateVideoUrl(url)) {
      setError('Please enter a valid video URL from a supported platform');
      return;
    }

    if (streams.length >= layout) {
      setError(`Maximum ${layout} streams allowed in current layout`);
      return;
    }

    const { embedUrl, originalUrl } = getVideoUrls(url);
    const newStream: VideoStream = {
      id: Date.now().toString(),
      url: originalUrl,
      embedUrl: embedUrl
    };

    setStreams([...streams, newStream]);
    setUrl('');
    setError('');
  };

  const handleRemoveStream = (id: string) => {
    setStreams(streams.filter(stream => stream.id !== id));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(streams);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setStreams(items);
  };

  return (
    <div className="h-screen overflow-hidden relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: 'url("/images/background2.jpeg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: 0
        }}
      />
      
      <div className="relative z-10 flex h-full">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Control Panel */}
          <div className="relative">
            <ControlPanel
              url={url}
              onUrlChange={setUrl}
              onAddStream={handleAddStream}
              layout={layout}
              onLayoutChange={setLayout}
              error={error}
            />
          </div>

          {/* Video Grid */}
          <div className="flex-1">
            <VideoGrid
              streams={streams}
              layout={layout}
              onDragEnd={handleDragEnd}
              onRemoveStream={handleRemoveStream}
              onSelectVideo={(id: string) => setSelectedVideoId(id)}
            />
          </div>
        </div>

        {/* AI Chat Sidebar */}
        <div className="w-96 border-l border-gray-800 bg-gray-900 bg-opacity-90">
          <AIChat selectedVideoId={selectedVideoId} />
        </div>
      </div>
    </div>
  );
};

export default VideoApp;