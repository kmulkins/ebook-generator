
import React from 'react';
import { Ebook } from '../types';

interface LibraryProps {
  manuscripts: Ebook[];
  onLoad: (ebook: Ebook) => void;
  onDelete: (index: number) => void;
  onBack: () => void;
}

const Library: React.FC<LibraryProps> = ({ manuscripts, onLoad, onDelete, onBack }) => {
  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">My Saved Manuscripts</h1>
        <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
          Back to Generator
        </button>
      </div>

      {manuscripts.length === 0 ? (
        <div className="text-center p-12 bg-slate-800/50 rounded-lg border border-slate-700">
          <p className="text-slate-400 text-lg">You haven't saved any manuscripts yet.</p>
          <button onClick={onBack} className="mt-4 text-blue-400 hover:text-blue-300 font-semibold">
            Create your first eBook
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {manuscripts.map((book, index) => (
            <div key={index} className="bg-slate-800 border border-slate-700 rounded-lg p-6 flex flex-col justify-between shadow-lg hover:shadow-xl transition-all">
              <div>
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{book.title}</h3>
                <p className="text-slate-400 text-sm mb-4">by {book.author}</p>
                <div className="text-xs text-slate-500 mb-4">
                  {book.chapters.length} Chapters • {book.trimSize}
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => onLoad(book)}
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded transition-colors"
                >
                  Open
                </button>
                <button
                  onClick={() => onDelete(index)}
                  className="py-2 px-3 bg-slate-700 hover:bg-red-600 text-white text-sm font-bold rounded transition-colors"
                  aria-label="Delete manuscript"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-8 text-center text-slate-500 text-sm">
        Storage used: {manuscripts.length}/3 slots
      </div>
    </div>
  );
};

export default Library;
