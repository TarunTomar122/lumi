import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Responsive helper functions
export const getResponsiveSize = (size: number) => {
  const baseWidth = 375; // iPhone 8 width as base
  let scale = width / baseWidth;
  
  // More aggressive scaling for smaller screens
  if (width < 350) {
    scale = scale * 0.8; // Make 20% smaller for very small screens
  } else if (width < 370) {
    scale = scale * 0.9; // Make 10% smaller for small screens
  }
  
  return scale * size;
};

export const getResponsiveHeight = (size: number) => {
  const baseHeight = 667; // iPhone 8 height as base
  let scale = height / baseHeight;
  
  // More aggressive scaling for smaller screens
  if (height < 600) {
    scale = scale * 0.75; // Make 25% smaller for very small screens
  } else if (height < 650) {
    scale = scale * 0.85; // Make 15% smaller for small screens
  }
  
  return scale * size;
}; 