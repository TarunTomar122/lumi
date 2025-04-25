import 'react';

declare module 'react' {
  interface React {
    useState: typeof import('react').useState;
    useEffect: typeof import('react').useEffect;
  }
} 