import React from 'react';
import { Ebook } from '../types';

interface PreviewModalProps {
  ebook: Ebook;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ ebook, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-4xl h-[90vh] flex flex-col animate-fade-in-fast">
        {/* Header */}
        <header className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-white" id="preview-modal-title">eBook Preview</h2>
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label="Close preview">
              <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-grow p-6 sm:p-8 overflow-y-auto prose prose-invert prose-slate max-w-none">
          <h1 className="text-center">{ebook.title}</h1>
          {ebook.subtitle && <h2 className="text-center !text-xl !text-slate-400 !mt-2">{ebook.subtitle}</h2>}
          <p className="text-center !text-lg !text-slate-300">by {ebook.author}</p>
          
          {ebook.dedication && (
            <p className="text-center italic mt-12 mb-12">{ebook.dedication}</p>
          )}

          {ebook.chapters.map((chapter, index) => (
            <div key={index} className="pt-8 mt-8 border-t border-slate-800 first:border-t-0 first:mt-0 first:pt-0">
              <h3 className="!text-2xl !mb-4">Chapter {index + 1}: {chapter.title}</h3>
              <div className="whitespace-pre-wrap text-slate-300">
                {chapter.fullContent || <p className="italic text-slate-500">[Content not written yet]</p>}
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
};

export default PreviewModal;
