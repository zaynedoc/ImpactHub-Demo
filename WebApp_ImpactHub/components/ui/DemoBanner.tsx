'use client';

import { Info, X } from 'lucide-react';
import { useState } from 'react';

export function DemoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-indigo-600/90 backdrop-blur-sm border-b border-indigo-400/30">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-3 text-sm text-white">
          <Info className="w-4 h-4 flex-shrink-0" />
          <p className="text-center">
            <span className="font-semibold">Demo Mode:</span> This is a demonstration. No information will be stored in a database unless API keys are configured.
          </p>
          <button
            onClick={() => setIsVisible(false)}
            className="ml-2 p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
