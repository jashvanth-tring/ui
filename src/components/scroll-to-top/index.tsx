import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ScrollToTopProps } from './scroll-to-top.types';

const ScrollToTop: React.FC<ScrollToTopProps> = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [location]);

  return <>{children}</>;
};

export default ScrollToTop;
