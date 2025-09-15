import React, { useEffect, useRef, useState } from 'react';
import * as UTIF from 'utif';

const TiffViewer = ({ file }: { file: File }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderTiff = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let arrayBuffer;

        if (file instanceof Blob) {
          // If 'file' is a Blob, read it directly
          arrayBuffer = await file.arrayBuffer();
        } else if (typeof file === 'string') {
          // If 'file' is a URL, fetch it
          const response = await fetch(file);
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const blob = await response.blob();
          arrayBuffer = await blob.arrayBuffer();
        } else {
          throw new Error('Invalid file type');
        }

        const ifds = UTIF.decode(arrayBuffer);
        UTIF.decodeImage(arrayBuffer, ifds[0]);

        const firstPage = ifds[0];
        const originalWidth = firstPage.width;
        const originalHeight = firstPage.height;

        // Set canvas dimensions to the desired display dimensions
        const canvas = canvasRef.current;
        if(canvas) {
          canvas.width = originalWidth;
          canvas.height = originalHeight;

          const rgba = UTIF.toRGBA8(firstPage);

          // Create an off-screen canvas with the original image dimensions
          const offCanvas = document.createElement('canvas');
          offCanvas.width = originalWidth;
          offCanvas.height = originalHeight;
          const offCtx = offCanvas.getContext('2d');

          const imageData = new ImageData(
            new Uint8ClampedArray(rgba),
            originalWidth,
            originalHeight
          );
          offCtx?.putImageData(imageData, 0, 0);

          const ctx = canvas.getContext('2d');

          // Draw the off-screen canvas onto the displayed canvas, scaling it to the desired dimensions
          ctx?.drawImage(offCanvas, 0, 0, originalWidth, originalHeight);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error rendering TIFF image:', error);
        setError('Error rendering TIFF image. The file may be corrupted or in an unsupported format.');
        setIsLoading(false);
      }
    };

    renderTiff();
  }, [file]);

  return (
    <div className="tiff-viewer-container">
      {isLoading && (
        <div className="tiff-loading">
          <div className="spinner"></div>
          <p>Loading TIFF image...</p>
        </div>
      )}
      
      {error && (
        <div className="tiff-error">
          <p>{error}</p>
        </div>
      )}
      
      <canvas
          ref={canvasRef}
        className={`tiff-canvas ${isLoading || error ? 'hidden' : ''}`}
        style={{
          maxWidth: '100%',
          height: 'auto',
          border: '1px solid #eef1f6',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)'
        }}
      />
    </div>
  );
};

export default TiffViewer;
