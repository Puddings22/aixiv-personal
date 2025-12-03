
import React from 'react';
import { Paper } from '../types';

interface PaperItemProps {
  paper: Paper;
  isFavorite: boolean;
  onToggleFavorite: (paperId: string) => void;
  isSelected: boolean;
  onToggleSelection: (paperId: string) => void;
  disabled?: boolean; // Added to disable interactions
}

const StarIconOutline: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.31h5.518a.562.562 0 0 1 .31.95l-4.052 3.502a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.82.623l-4.42-3.134a.563.563 0 0 0-.652 0L6.697 19.94a.562.562 0 0 1-.82-.623l1.285-5.385a.562.562 0 0 0-.182-.557l-4.052-3.502a.562.562 0 0 1 .31-.95h5.518a.563.563 0 0 0 .475-.31L11.48 3.5Z" />
  </svg>
);

const StarIconFilled: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.116 3.986 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.986c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
  </svg>
);


const PaperItem: React.FC<PaperItemProps> = ({ paper, isFavorite, onToggleFavorite, isSelected, onToggleSelection, disabled }) => {
  const formattedPublishedDate = new Date(paper.publishedDate).toLocaleDateString();
  const formattedUpdatedDate = new Date(paper.updatedDate).toLocaleDateString();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault(); 
    e.stopPropagation();
    onToggleFavorite(paper.id);
  };

  const handleSelectionClick = (e: React.MouseEvent) => {
    if (disabled) return;
     if ((e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault(); 
     }
     onToggleSelection(paper.id);
  };

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div 
        className={`bg-white shadow-lg rounded-xl p-6 border hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between h-full 
                    ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'} 
                    ${isSelected && !disabled ? 'border-green-500 ring-2 ring-green-500' : 'border-green-200'}`}
        onClick={disabled ? undefined : handleSelectionClick}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
            <input
                type="checkbox"
                className="h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500 mr-3 mt-1 self-start shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                checked={isSelected}
                onChange={disabled ? undefined : () => onToggleSelection(paper.id)}
                onClick={stopPropagation} 
                aria-label={`Select paper ${paper.title}`}
                disabled={disabled}
            />
          <h3 className="text-xl font-semibold text-green-700 mr-2 flex-grow">{paper.title}</h3>
          <button
            onClick={(e) => { stopPropagation(e); handleFavoriteClick(e);}}
            className={`p-1 rounded-full hover:bg-yellow-100 transition-colors shrink-0 ${isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-400'} disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            disabled={disabled}
          >
            {isFavorite ? <StarIconFilled className="w-6 h-6" /> : <StarIconOutline className="w-6 h-6" />}
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-1 ml-8"> 
          Published: {formattedPublishedDate} | Updated: {formattedUpdatedDate}
        </p>
        <div className="mb-3 ml-8">
          {paper.authors.slice(0, 3).map((author, index) => (
            <span key={index} className="text-sm text-gray-600 italic mr-1">
              {author.name}{paper.authors.length > 3 && index === 2 ? ' et al.' : (index < paper.authors.length -1 && index < 2 ? ', ' : '')}
            </span>
          ))}
           {paper.authors.length === 0 && <span className="text-sm text-gray-600 italic">Authors not specified</span>}
        </div>
        
        <div 
            className="text-sm text-gray-700 mb-3 max-h-[10rem] overflow-y-auto pr-2 ml-8"
            aria-label={`Summary for ${paper.title}`}
        >
          {paper.summary || "No summary available."}
        </div>
        
        {paper.categories && paper.categories.length > 0 && (
          <div className="mb-3 ml-8">
            <span className="font-medium text-sm text-gray-700">Categories: </span>
            {paper.categories.slice(0, 3).map((cat, idx) => (
              <span key={idx} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full mr-1 mb-1 inline-block">
                {cat}
              </span>
            ))}
            {paper.categories.length > 3 && <span className="text-xs text-gray-500">...</span>}
          </div>
        )}
      </div>
      <a
        href={paper.pdfLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
            stopPropagation(e); 
            if(disabled) e.preventDefault(); // Prevent navigation if disabled
        }}
        className={`mt-auto self-start inline-block bg-green-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-600 transition-colors duration-150 ml-8 ${disabled ? 'opacity-50 cursor-not-allowed !bg-gray-400' : ''}`}
        aria-disabled={disabled}
      >
        View PDF
      </a>
    </div>
  );
};

export default PaperItem;
