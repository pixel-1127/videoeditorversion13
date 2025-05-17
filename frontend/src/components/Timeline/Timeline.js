import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import TimeScale from './TimeScale';
import Track from './Track';

const Timeline = forwardRef(({
  tracks,
  currentTime,
  duration,
  zoom,
  selectedClipId,
  onSelectClip,
  onUpdateClip,
  onTimeUpdate
}, ref) => {
  const timelineRef = useRef(null);
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [timelineWidth, setTimelineWidth] = useState(0);
  
  // Calculate pixel per second based on zoom factor
  const pixelsPerSecond = 100 * zoom;
  
  // Calculate timeline content width
  useEffect(() => {
    const width = Math.max(duration * pixelsPerSecond, 1000);
    setTimelineWidth(width);
  }, [duration, pixelsPerSecond]);
  
  // Measure container width for time scale
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width);
        }
      });
      
      resizeObserver.observe(containerRef.current);
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);
  
  // Handle timeline click to update current time
  const handleTimelineClick = (e) => {
    if (isDraggingRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const scrollLeft = containerRef.current.scrollLeft;
    const newTime = (offsetX + scrollLeft) / pixelsPerSecond;
    
    onTimeUpdate(Math.max(0, Math.min(newTime, duration)));
  };
  
  // Auto-scroll to keep the playhead visible during playback with improved performance
  useEffect(() => {
    if (!containerRef.current || !isPlaying) return;
    
    const playheadPosition = currentTime * pixelsPerSecond;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Use a more generous threshold for auto-scrolling
    const threshold = containerRect.width * 0.3;
    
    // Only auto-scroll if we're significantly outside the visible area
    if (playheadPosition < container.scrollLeft + (threshold / 2)) {
      // Use smooth scrolling behavior when auto-scrolling
      container.scrollTo({
        left: Math.max(0, playheadPosition - threshold),
        behavior: 'smooth'
      });
    } else if (playheadPosition > container.scrollLeft + containerRect.width - (threshold / 2)) {
      container.scrollTo({
        left: Math.min(
          container.scrollWidth - containerRect.width,
          playheadPosition - containerRect.width + threshold
        ),
        behavior: 'smooth'
      });
    }
  }, [currentTime, pixelsPerSecond, isPlaying]);
  
  // Render playhead at current time position
  const renderPlayhead = () => {
    const playheadPosition = currentTime * pixelsPerSecond;
    
    return (
      <div 
        className="current-time-indicator absolute top-0 bottom-0 w-0.5 bg-editor-highlight z-10 pointer-events-none"
        style={{ 
          left: `${playheadPosition}px`,
          transform: 'translateX(-50%)', // Center the playhead on the exact time position
          transition: 'left 0.05s linear' // Add a very slight transition for smoother movement
        }}
      />
    );
  };
  
  return (
    <div className="timeline-component flex flex-col h-full bg-editor-timeline">
      <TimeScale 
        duration={duration} 
        pixelsPerSecond={pixelsPerSecond}
        containerWidth={containerWidth}
      />
      
      <div 
        ref={containerRef}
        className="timeline-scroll editor-scrollbar"
      >
        <div 
          ref={timelineRef}
          className="timeline-content"
          style={{ width: `${timelineWidth}px` }}
          onClick={handleTimelineClick}
        >
          {tracks.map((track) => (
            <Track
              key={track.id}
              track={track}
              pixelsPerSecond={pixelsPerSecond}
              selectedClipId={selectedClipId}
              onSelectClip={onSelectClip}
              onUpdateClip={onUpdateClip}
              isDraggingRef={isDraggingRef}
            />
          ))}
          
          {renderPlayhead()}
        </div>
      </div>
    </div>
  );
});

Timeline.displayName = 'Timeline';

export default Timeline;