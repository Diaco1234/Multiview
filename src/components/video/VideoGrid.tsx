import React, { useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProps, DroppableProvided, DroppableStateSnapshot } from 'react-beautiful-dnd';
import clsx from 'clsx';
import { VideoStream } from '../../types';
import { VideoCell } from './VideoCell';

interface VideoGridProps {
  streams: VideoStream[];
  layout: number;
  onDragEnd: (result: DropResult) => void;
  onRemoveStream: (id: string) => void;
  onSelectVideo: (id: string) => void;
}

const VALID_LAYOUTS = [1, 2, 4, 8, 12];

const getGridConfig = (layout: number) => {
  if (!VALID_LAYOUTS.includes(layout)) {
    console.warn(`Invalid layout: ${layout}. Defaulting to 4.`);
    return {
      cols: 'grid-cols-2',
      rows: 'grid-rows-2',
      responsive: 'md:grid-cols-2 md:grid-rows-2'
    };
  }

  switch (layout) {
    case 1:
      return {
        cols: 'grid-cols-1',
        rows: 'grid-rows-1',
        responsive: 'md:grid-cols-1 md:grid-rows-1'
      };
    case 2:
      return {
        cols: 'grid-cols-1',
        rows: 'grid-rows-2',
        responsive: 'md:grid-cols-2 md:grid-rows-1'
      };
    case 4:
      return {
        cols: 'grid-cols-2',
        rows: 'grid-rows-2',
        responsive: 'md:grid-cols-2 md:grid-rows-2'
      };
    case 8:
      return {
        cols: 'grid-cols-2',
        rows: 'grid-rows-4',
        responsive: 'md:grid-cols-4 md:grid-rows-2'
      };
    case 12:
      return {
        cols: 'grid-cols-3',
        rows: 'grid-rows-4',
        responsive: 'md:grid-cols-4 md:grid-rows-3'
      };
    default:
      return {
        cols: 'grid-cols-2',
        rows: 'grid-rows-2',
        responsive: 'md:grid-cols-2 md:grid-rows-2'
      };
  }
};

const StrictModeDroppable = ({ children, ...props }: DroppableProps) => {
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return <Droppable {...props}>{children}</Droppable>;
};

const VideoGrid: React.FC<VideoGridProps> = ({ streams, layout, onDragEnd, onRemoveStream, onSelectVideo }) => {
  const gridConfig = getGridConfig(layout);

  return (
    <div className="h-full w-full p-4">
      <DragDropContext onDragEnd={onDragEnd}>
        <StrictModeDroppable droppableId="video-grid" type="VIDEO_GRID">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={clsx(
                'h-full w-full grid gap-4 min-h-[200px]',
                gridConfig.cols,
                gridConfig.rows,
                gridConfig.responsive
              )}
            >
              {streams.map((stream, index) => (
                <Draggable 
                  key={stream.id} 
                  draggableId={stream.id} 
                  index={index}
                  isDragDisabled={streams.length === 1}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={{
                        ...provided.draggableProps.style,
                        height: snapshot.isDragging ? '200px' : '100%'
                      }}
                    >
                      <VideoCell
                        stream={stream}
                        onRemove={onRemoveStream}
                        onSelect={() => onSelectVideo(stream.id)}
                        innerRef={provided.innerRef}
                        draggableProps={provided.draggableProps}
                        dragHandleProps={provided.dragHandleProps}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </StrictModeDroppable>
      </DragDropContext>
    </div>
  );
};

export default VideoGrid;