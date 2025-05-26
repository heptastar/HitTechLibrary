'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

interface SearchParamsHandlerProps {
  onMessageFound: (message: string) => void;
}

export default function SearchParamsHandler({ onMessageFound }: SearchParamsHandlerProps) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Check for the 'message' query parameter on component mount
    const message = searchParams.get('message');
    if (message) {
      onMessageFound(message);
      // Optional: Clear the message from the URL after displaying it
      // history.replaceState(null, '', location.pathname);
    }
  }, [searchParams, onMessageFound]);
  
  return null; // This component doesn't render anything
}