import Button from '../ui/Button';
import Input from '../ui/Input';
import { validateVideoUrl } from '../../utils/validation';

interface ControlPanelProps {
  url: string;
  onUrlChange: (url: string) => void;
  onAddStream: () => void;
  layout: number;
  onLayoutChange: (layout: number) => void;
  error?: string;
}

const ControlPanel = ({
  url,
  onUrlChange,
  onAddStream,
  layout,
  onLayoutChange,
  error
}: ControlPanelProps) => {
  return (
    <div className="p-4 border-b border-purple-800/30 backdrop-blur-sm bg-purple-900/30">
      <div className="container mx-auto flex flex-wrap gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Enter video URL..."
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            error={error}
          />
        </div>
        <Button onClick={onAddStream} disabled={!validateVideoUrl(url)}>
          Add Stream
        </Button>
        <select
          value={layout}
          onChange={(e) => onLayoutChange(Number(e.target.value))}
          className="px-4 py-2 bg-purple-900/50 border border-purple-700 rounded-lg text-white 
                   focus:outline-none focus:border-purple-500 transition-colors"
        >
          <option value={1}>Single View</option>
          <option value={2}>2 Streams</option>
          <option value={4}>4 Streams</option>
          <option value={8}>8 Streams</option>
          <option value={12}>12 Streams</option>
        </select>
      </div>
    </div>
  );
};

export default ControlPanel;