
import React, { useState } from 'react';
import { Chapter } from '../types';

interface ChapterCardProps {
  chapter: Chapter;
  index: number;
  isWriting: boolean;
  imageUrl: string | null;
  isGeneratingImage: boolean;
  imageError: string | null;
  onContentChange: (newContent: string) => void;
  onProofread: () => Promise<void>;
  onGenerateImage: () => void;
}

const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  index,
  isWriting,
  imageUrl,
  isGeneratingImage,
  imageError,
  onContentChange,
  onProofread,
  onGenerateImage,
}) => {
  const [isOpen, setIsOpen] = useState(index === 0);
  const [isProofreadingThisChapter, setIsProofreadingThisChapter] = useState(false);

  const handleProofreadClick = async () => {
    setIsProofreadingThisChapter(true);
    await onProofread();
    setIsProofreadingThisChapter(false);
  };

  return (
    <div className="border border-slate-700 bg-slate-800/50 rounded-lg overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left"
      >
        <div className="flex items-center">
          <span className="text-blue-400 font-bold mr-4 text-lg">Chapter {index + 1}</span>
          <h3 className="text-lg font-semibold text-white">{chapter.title}</h3>
        </div>
        <svg
          className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      <div
        className={`transition-all duration-500 ease-in-out ${
          isOpen ? 'max-h-[100rem] opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}
      >
        <div className="p-6 border-t border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div>
                    <h4 className="font-semibold text-blue-300 mb-3 text-base">Key Points</h4>
                    <ul className="space-y-2 list-disc list-inside text-slate-300">
                        {chapter.contentPoints.map((point, i) => (
                        <li key={i}>{point}</li>
                        ))}
                    </ul>
                </div>
                <div className="flex flex-col items-center justify-center mt-4 md:mt-0">
                    <div className="w-full aspect-[4/3] bg-slate-700/50 rounded-lg shadow-lg mb-3 flex items-center justify-center text-slate-400 relative overflow-hidden group">
                      {isGeneratingImage && (
                        <div className="absolute inset-0 bg-slate-800 z-10 flex flex-col items-center justify-center p-4">
                           <svg className="w-8 h-8 mb-2 text-slate-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-sm">Creating illustration...</span>
                        </div>
                      )}
                      
                      {imageError ? (
                        <div className="text-center text-red-400 p-4 flex flex-col items-center w-full">
                          <p className="font-semibold text-sm mb-1">Illustration Failed</p>
                          <p className="text-xs mb-3 opacity-80">{imageError}</p>
                          <button 
                            onClick={onGenerateImage}
                            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white transition-colors border border-slate-600"
                          >
                            Retry
                          </button>
                        </div>
                      ) : imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={chapter.illustrationPrompt}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                         <div className="flex flex-col items-center justify-center p-4 text-center w-full h-full">
                            <p className="text-sm text-slate-400 mb-3">No illustration yet</p>
                            <button 
                                onClick={onGenerateImage}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold text-white transition-colors shadow-md"
                            >
                                Generate Illustration
                            </button>
                         </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 italic text-center">
                        "{chapter.illustrationPrompt}"
                    </p>
                </div>
            </div>
            {(chapter.fullContent || isWriting) && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-blue-300 text-base">Chapter Content</h4>
                        {chapter.fullContent && !isWriting && (
                           <button
                             onClick={handleProofreadClick}
                             disabled={isProofreadingThisChapter}
                             className="flex items-center justify-center gap-2 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                           >
                            {isProofreadingThisChapter ? (
                                <>
                                <svg className="animate-spin -ml-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span>Proofreading...</span>
                                </>
                            ) : (
                                <>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                                <span>Proofread Chapter</span>
                                </>
                            )}
                           </button>
                        )}
                    </div>
                    {isWriting ? (
                         <div className="space-y-3 animate-pulse">
                            <div className="h-4 bg-slate-700 rounded w-full"></div>
                            <div className="h-4 bg-slate-700 rounded w-5/6"></div>
                            <div className="h-4 bg-slate-700 rounded w-full"></div>
                            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                         </div>
                    ) : (
                        <textarea
                            value={chapter.fullContent || ''}
                            onChange={(e) => onContentChange(e.target.value)}
                            className="w-full h-96 bg-slate-900/70 border border-slate-700 rounded-md p-4 text-slate-300 whitespace-pre-wrap focus:ring-2 focus:ring-blue-500 focus:outline-none transition resize-y"
                            aria-label={`Content for ${chapter.title}`}
                        />
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ChapterCard;
