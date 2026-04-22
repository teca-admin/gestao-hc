import { useState, useEffect } from 'react';

export const useViewMode = () => {
  const [isViewMode, setIsViewMode] = useState(false);
  const [sharedToken, setSharedToken] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se há um token na URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('share');
    
    if (token) {
      setSharedToken(token);
      setIsViewMode(true);
    }
  }, []);

  return { isViewMode, sharedToken };
};
