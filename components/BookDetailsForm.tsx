
import React, { useState } from 'react';
import { TrimSize, FontChoice } from '../types';

export interface BookDetails {
  author: string;
  dedication?: string;
  audience: string;
  takeaways: string;
  tone: string;
  trimSize: TrimSize;
  font: FontChoice;
}

interface BookDetailsFormProps {
  onSubmit: (details: BookDetails) => void;
  topic: string;
  isLoading: boolean;
}

const trimOptions: { value: TrimSize; label: string }[] = [
    { value: '5x8', label: '5" x 8"' },
    { value: '5.5x8.5', label: '5.5" x 8.5"' },
    { value: '6x9', label: '6" x 9"' },
    { value: '8.5x11', label: '8.5" x 11"' },
];

const fontOptions: { value: FontChoice; label: string }[] = [
    { value: 'Garamond', label: 'Garamond (Serif)' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Helvetica', label: 'Helvetica (Sans)' },
    { value: 'Courier', label: 'Courier (Mono)' },
];


const BookDetailsForm: React.FC<BookDetailsFormProps> = ({ onSubmit, topic, isLoading }) => {
  const [details, setDetails] = useState<BookDetails>({
    author: '',
    dedication: '',
    audience: '',
    takeaways: '',
    tone: '',
    trimSize: '5.5x8.5',
    font: 'Garamond',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleTrimSizeChange = (size: TrimSize) => {
    setDetails(prev => ({ ...prev, trimSize: size }));
  };

  const handleFontChange = (font: FontChoice) => {
    setDetails(prev => ({ ...prev, font: font }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) {
      onSubmit(details);
    }
  };

  const isFormValid = details.author.trim() && details.audience.trim() && details.takeaways.trim() && details.tone.trim();

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
          Flesh Out Your eBook
        </h1>
        <p className="text-lg text-slate-400">
          Tell us more about your eBook: <span className="font-semibold text-slate-300">"{topic}"</span>
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800/50 border border-slate-700 p-8 rounded-lg">
        
        {/* Author Name */}
        <div>
          <label htmlFor="author" className="block text-sm font-medium text-slate-300 mb-2">Author Name</label>
          <input
            type="text"
            id="author"
            name="author"
            value={details.author}
            onChange={handleChange}
            placeholder="e.g., Jane Doe"
            className="w-full p-3 bg-slate-800 border border-slate-600 rounded-md text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            disabled={isLoading}
            required
          />
        </div>
        
        {/* Formatting Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trim Size */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">eBook Trim Size</label>
              <div className="flex flex-wrap gap-2">
                {trimOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleTrimSizeChange(option.value)}
                    className={`flex-1 min-w-[80px] text-center py-2 px-3 rounded-md border-2 transition-all duration-200 text-sm ${
                      details.trimSize === option.value
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                        : 'bg-slate-800 border-slate-600 hover:bg-slate-700 hover:border-slate-500 text-slate-300'
                    }`}
                    disabled={isLoading}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Font */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Body Font (12pt)</label>
              <div className="flex flex-wrap gap-2">
                {fontOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleFontChange(option.value)}
                    className={`flex-1 min-w-[80px] text-center py-2 px-3 rounded-md border-2 transition-all duration-200 text-sm ${
                      details.font === option.value
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                        : 'bg-slate-800 border-slate-600 hover:bg-slate-700 hover:border-slate-500 text-slate-300'
                    }`}
                    disabled={isLoading}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
        </div>

        {/* Target Audience */}
        <div>
          <label htmlFor="audience" className="block text-sm font-medium text-slate-300 mb-2">Who is the target audience?</label>
          <textarea
            id="audience"
            name="audience"
            value={details.audience}
            onChange={handleChange}
            placeholder="e.g., 'Beginner Python developers who want to learn web scraping.'"
            className="w-full h-24 p-3 bg-slate-800 border border-slate-600 rounded-md text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition resize-none"
            disabled={isLoading}
            required
          />
        </div>

        {/* Key Takeaways */}
        <div>
          <label htmlFor="takeaways" className="block text-sm font-medium text-slate-300 mb-2">What are the top 3 takeaways for the reader?</label>
          <textarea
            id="takeaways"
            name="takeaways"
            value={details.takeaways}
            onChange={handleChange}
            placeholder="e.g., '1. How to set up their environment. 2. How to handle dynamic websites. 3. How to store the scraped data.'"
            className="w-full h-24 p-3 bg-slate-800 border border-slate-600 rounded-md text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition resize-none"
            disabled={isLoading}
            required
          />
        </div>

        {/* Tone */}
        <div>
          <label htmlFor="tone" className="block text-sm font-medium text-slate-300 mb-2">What's the desired tone?</label>
          <input
            type="text"
            id="tone"
            name="tone"
            value={details.tone}
            onChange={handleChange}
            placeholder="e.g., Conversational and encouraging"
            className="w-full p-3 bg-slate-800 border border-slate-600 rounded-md text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            disabled={isLoading}
            required
          />
        </div>

        {/* Dedication (Optional) */}
        <div>
          <label htmlFor="dedication" className="block text-sm font-medium text-slate-300 mb-2">Dedication (Optional)</label>
          <textarea
            id="dedication"
            name="dedication"
            value={details.dedication}
            onChange={handleChange}
            placeholder="For everyone who dared to start."
            className="w-full h-20 p-3 bg-slate-800 border border-slate-600 rounded-md text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition resize-none"
            disabled={isLoading}
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !isFormValid}
          className="w-full flex justify-center items-center py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
        >
          {isLoading ? (
             <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          ) : 'Generate eBook Outline'}
        </button>
      </form>
    </div>
  );
};

export default BookDetailsForm;
