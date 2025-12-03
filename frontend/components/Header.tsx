import React from 'react';
import { ViewMode } from '../types';

const Logo: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="url(#gradLogo)"/>
    <defs>
      <linearGradient id="gradLogo" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#34D399" /> 
        <stop offset="100%" stopColor="#FBBF24" /> 
      </linearGradient>
    </defs>
    <text x="50" y="62" fontFamily="Arial, sans-serif" fontSize="40" fill="#FFFFFF" textAnchor="middle" fontWeight="bold">
      AI
    </text>
    <path d="M20 80 Q50 70, 80 80" stroke="#FFFFFF" strokeWidth="3" fill="none" />
  </svg>
);

interface HeaderProps {
  viewMode: ViewMode;
  onToggleViewMode: () => void;
  favoriteCount: number;
}

const StarIconFilled: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.116 3.986 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.986c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
  </svg>
);


const Header: React.FC<HeaderProps> = ({ viewMode, onToggleViewMode, favoriteCount }) => {
  return (
    <header className="bg-green-600 text-white p-4 shadow-md">
      <div className="w-full max-w-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3">
          <Logo />
          <h1 className="text-3xl font-bold tracking-tight">AIxiv Insights</h1>
        </div>
        <button
          onClick={onToggleViewMode}
          className="flex items-center px-4 py-2 bg-yellow-400 text-yellow-900 hover:bg-yellow-500 font-semibold rounded-md shadow transition-colors duration-150"
          aria-label={viewMode === 'search' ? `View ${favoriteCount} favorites` : "Back to search"}
        >
          {viewMode === 'search' ? (
            <>
              <StarIconFilled className="w-5 h-5 mr-2" />
              Favorites ({favoriteCount})
            </>
          ) : (
            "Back to Search"
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;