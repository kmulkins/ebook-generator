import React, { useState } from 'react';

interface TitleSelectionFormProps {
  suggestions: string[];
  idea: string;
  onSelect: (title: string) => void;
}

const TitleSelectionForm: React.FC<TitleSelectionFormProps> = ({ suggestions, idea, onSelect }) => {
  const [selectedTitle, setSelectedTitle] = useState('');
  const [customTitle, setCustomTitle] = useState(idea);

  const handleSelectSuggestion = (title: string) => {
    setSelectedTitle(title);
    setCustomTitle(title); // also update the input field
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTitle.trim()) {
      onSelect(customTitle.trim());
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
          Choose Your Title
        </h1>
        <p className="text-lg text-slate-400">
          We've generated some ideas based on: <span className="font-semibold text-slate-300">"{idea}"</span>
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {suggestions.map((title, index) => (
          <button
            key={index}
            onClick={() => handleSelectSuggestion(title)}
            className={`w-full p-4 text-left rounded-lg transition-all duration-200 border-2 ${
              selectedTitle === title
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                : 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600 text-slate-300'
            }`}
          >
            {title}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label htmlFor="customTitle" className="block text-sm font-medium text-slate-300 mb-2">
            Or write your own:
            </label>
            <input
                type="text"
                id="customTitle"
                value={customTitle}
                onChange={(e) => {
                    setCustomTitle(e.target.value);
                    setSelectedTitle(''); // deselect suggestion if typing
                }}
                className="w-full p-3 bg-slate-800 border border-slate-600 rounded-md text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
        </div>
        <button
          type="submit"
          disabled={!customTitle.trim()}
          className="w-full flex justify-center items-center py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
        >
          Continue with this Title
        </button>
      </form>
    </div>
  );
};

export default TitleSelectionForm;