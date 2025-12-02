
import React, { useState } from 'react';

interface BookIdeaFormProps {
  onSubmit: (idea: string) => void;
  isLoading: boolean;
}

const BookIdeaForm: React.FC<BookIdeaFormProps> = ({ onSubmit, isLoading }) => {
  const [idea, setIdea] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim() && !isLoading) {
      onSubmit(idea.trim());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
          Turn Your Idea Into an eBook
        </h1>
        <p className="text-lg text-slate-400">
          From a single idea, generate title suggestions and a complete eBook outline in under 5 minutes.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="e.g., 'A guide to intermittent fasting for beginners'"
          className="w-full h-32 p-4 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200 resize-none"
          disabled={isLoading}
          aria-label="Enter your eBook idea"
        />
        <button
          type="submit"
          disabled={isLoading || !idea.trim()}
          className="w-full flex justify-center items-center py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
        >
          {isLoading ? (
             <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          ) : 'Get Title Ideas'}
        </button>
      </form>
    </div>
  );
};

export default BookIdeaForm;