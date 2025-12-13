import { Stage, Layer, Image as KonvaImage, Line } from 'react-konva';
import { useRef, useEffect, useState } from 'react';
import useImage from 'use-image';
import { processImage } from '../../utils/AssetProcessor';
import { snapToGrid } from '../../utils/grid';
import { useGameStore } from '../../store/gameStore';
import GridOverlay from './GridOverlay';
import ImageCropper from '../ImageCropper';

const URLImage = ({ src, x, y, width, height }: any) => {
  const safeSrc = src.startsWith('file:') ? src.replace('file:', 'media:') : src;
  const [img] = useImage(safeSrc);
  return (
    <KonvaImage
      image={img}
      x={x}
      y={y}
      width={width}
      height={height}
      draggable
    />
  );
};

interface CanvasManagerProps {
  tool?: 'select' | 'marker' | 'eraser';
}

const CanvasManager = ({ tool = 'select' }: CanvasManagerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const { tokens, drawings, gridSize, addToken, addDrawing } = useGameStore();

  const isDrawing = useRef(false);
  const currentLine = useRef<any>(null); // Temp line points
  const [tempLine, setTempLine] = useState<any>(null);

  // Cropping State
  const [pendingCrop, setPendingCrop] = useState<{ src: string, x: number, y: number } | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();

    const stageRect = containerRef.current?.getBoundingClientRect();
    if (!stageRect) return;
    const rawX = e.clientX - stageRect.left;
    const rawY = e.clientY - stageRect.top;
    const { x, y } = snapToGrid(rawX, rawY, gridSize);

    // Check for JSON (Library Item)
    const jsonData = e.dataTransfer.getData('application/json');
    if (jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.type === 'LIBRARY_TOKEN') {
                addToken({
                    id: crypto.randomUUID(),
                    x,
                    y,
                    src: data.src,
                    scale: 1,
                });
                return;
            }
        } catch (err) {
            console.error(err);
        }
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      // Create Object URL for cropping
      const objectUrl = URL.createObjectURL(file);
      setPendingCrop({ src: objectUrl, x, y });
    }
  };

  const handleCropConfirm = async (blob: Blob) => {
    if (!pendingCrop) return;

    try {
        // Convert blob to file-like object or modify ProcessImage to accept Blob
        const file = new File([blob], "token.webp", { type: 'image/webp' });

        // We can reuse processImage but it expects resizing logic.
        // Since we already cropped and likely want to keep that quality or just format it,
        // Let's modify processImage to just save if it's already a blob?
        // Or just let processImage handle the standardized resizing (max 512px) + saving.
        // Yes, let processImage optimize it for storage.
        const src = await processImage(file, 'TOKEN');

        addToken({
          id: crypto.randomUUID(),
          x: pendingCrop.x,
          y: pendingCrop.y,
          src,
          scale: 1,
        });
    } catch (err) {
        console.error("Crop save failed", err);
    } finally {
        setPendingCrop(null);
    }
  };

  // Drawing Handlers
  const handleMouseDown = (e: any) => {
    if (tool === 'select') return;
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    currentLine.current = {
        id: crypto.randomUUID(),
        tool: tool,
        points: [pos.x, pos.y],
        color: tool === 'eraser' ? '#000000' : '#df4b26', // Eraser is just black for now, or globalCompositeOperation
        size: tool === 'eraser' ? 20 : 5,
    };
    // We could optimistically add to store or use local state
    // For syncing to appear "instant" we should add to store immediately?
    // But updating store on every move is heavy.
    // Better: Render currentLine locally, then commit to store on MouseUp.
    // For sync requirement: "Drawings must be synchronized to the Player View instantly".
    // "Instantly" might imply while drawing.
    // Let's commit on MouseUp for performance, or throttle updates.
    // For MVP, commit on MouseUp is safer.
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing.current || tool === 'select') return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const cur = currentLine.current;

    // update local ref points
    cur.points = cur.points.concat([point.x, point.y]);

    // Force update? No, we need react state to re-render the temp line.
    // Actually, let's just use local state for the active line.
    setTempLine({...cur});
  };

  const handleMouseUp = () => {
    if (!isDrawing.current || tool === 'select') return;
    isDrawing.current = false;
    if (tempLine) {
        addDrawing(tempLine);
        setTempLine(null);
    }
  };

  return (
    <div
        ref={containerRef}
        className="w-full h-full bg-neutral-900 overflow-hidden relative"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
    >
      {pendingCrop && (
        <ImageCropper
            imageSrc={pendingCrop.src}
            onConfirm={handleCropConfirm}
            onCancel={() => setPendingCrop(null)}
        />
      )}

      <Stage
        width={size.width}
        height={size.height}
        draggable={tool === 'select'}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Layer>
            <GridOverlay width={size.width} height={size.height} gridSize={gridSize} />

            {/* Drawings */}
            {drawings.map((line) => (
                <Line
                    key={line.id}
                    points={line.points}
                    stroke={line.color}
                    strokeWidth={line.size}
                    tension={0.5}
                    lineCap="round"
                    globalCompositeOperation={
                        line.tool === 'eraser' ? 'destination-out' : 'source-over'
                    }
                />
            ))}

            {/* Temp Line */}
            {tempLine && (
                <Line
                    points={tempLine.points}
                    stroke={tempLine.color}
                    strokeWidth={tempLine.size}
                    tension={0.5}
                    lineCap="round"
                    globalCompositeOperation={
                        tempLine.tool === 'eraser' ? 'destination-out' : 'source-over'
                    }
                />
            )}

            {/* Tokens */}
            {tokens.map((token) => (
                <URLImage
                    key={token.id}
                    src={token.src}
                    x={token.x}
                    y={token.y}
                    width={gridSize * token.scale}
                    height={gridSize * token.scale}
                />
            ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default CanvasManager;
