import React, { useState } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import image from '../../assets/placeholder-image/placeholder_media.svg';
import styles from './lazyLoad.module.css';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  effect?: 'blur' | 'opacity';
  srcSet?: string; // Optional srcSet for responsive images
  sizes?: string; // Optional sizes attribute
  fallbackSrc?: string; // Fallback image if loading fails
  mainContainerClassName?: string; // Class name for the outer container
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = '',
  effect = 'blur',
  srcSet = '',
  sizes = '',
  fallbackSrc = image,
  mainContainerClassName = 'w-full h-full', // Default to full width and height
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false); // Track image load state
  const placeholderSrc = placeholder || fallbackSrc;

  const handleError = () => {
    setHasError(true);
  };

  const handleLoad = () => {
    setIsLoaded(true); // Image has fully loaded
    setHasError(false);
  };

  return (
    <div className={mainContainerClassName}>
      {!isLoaded && (
        <div className={styles.waveSkeleton}>
          <div className={styles.wave}></div>
        </div>
      )}
      <LazyLoadImage
        alt={alt}
        src={hasError ? fallbackSrc : src}
        srcSet={srcSet}
        sizes={sizes}
        placeholderSrc={placeholderSrc}
        effect={effect}
        className={`${styles.image} ${isLoaded ? styles.imageLoaded : ''} ${className}`}
        wrapperProps={{ style: { display: 'unset' } }}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
};

export default OptimizedImage;
