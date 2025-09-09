import type { StaticImageData } from 'next/image';

interface ScreenshotProps {
  imageSrc: StaticImageData;
  description: string;
  onClick: () => void;
}

const Screenshot = ({ imageSrc, description, onClick }: ScreenshotProps) => (
  <div className="screenshot-container" onClick={onClick}>
    <p>{description}</p>
    <img src={imageSrc.src} alt="Processing Screenshot" className="screenshot-image" />
  </div>
);

export default Screenshot;
