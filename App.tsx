
import React, { useState, useCallback, useEffect } from 'react';
import { Ebook } from './types';
import { generateEbook, EbookGenerationDetails, generateTitleSuggestions } from './services/geminiService';
import BookIdeaForm from './components/BookIdeaForm';
import LoadingSpinner from './components/LoadingSpinner';
import EbookResult from './components/EbookResult';
import BookDetailsForm, { BookDetails } from './components/BookDetailsForm';
import TitleSelectionForm from './components/TitleSelectionForm';
import SignUpForm from './components/SignUpForm';
import Library from './components/Library';

type AppStep = 'sign_up' | 'idea' | 'generating_titles' | 'title_selection' | 'details' | 'generating' | 'result' | 'error' | 'library';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('sign_up');
  const [idea, setIdea] = useState<string>('');
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<string>('');
  const [ebookData, setEbookData] = useState<Ebook | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Library State
  const [savedManuscripts, setSavedManuscripts] = useState<Ebook[]>(() => {
    try {
      const saved = localStorage.getItem('ebook-generator-library');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load library", e);
      return [];
    }
  });

  const handleSignUp = useCallback(() => {
    setStep('idea');
  }, []);

  const handleSignOut = useCallback(() => {
    setIdea('');
    setTitleSuggestions([]);
    setSelectedTitle('');
    setEbookData(null);
    setError(null);
    setStep('sign_up');
  }, []);

  const handleIdeaSubmit = useCallback(async (submittedIdea: string) => {
    setIdea(submittedIdea);
    setStep('generating_titles');
    setError(null);
    try {
      const titles = await generateTitleSuggestions(submittedIdea);
      setTitleSuggestions(titles);
      setStep('title_selection');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while generating titles.');
      setStep('error');
    }
  }, []);

  const handleTitleSelect = useCallback((title: string) => {
    setSelectedTitle(title);
    setStep('details');
  }, []);
  
  const handleDetailsSubmit = useCallback(async (details: BookDetails) => {
    setStep('generating');
    setError(null);
    setEbookData(null);

    const fullDetails: EbookGenerationDetails = {
        topic: selectedTitle,
        ...details
    };

    try {
      const result = await generateEbook(fullDetails);
      setEbookData(result);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setStep('error');
    }
  }, [selectedTitle]);

  const handleReset = useCallback(() => {
    setIdea('');
    setTitleSuggestions([]);
    setSelectedTitle('');
    setEbookData(null);
    setError(null);
    setStep('idea');
  }, []);

  // Library Handlers
  const handleSaveManuscript = useCallback((ebookToSave: Ebook) => {
    if (savedManuscripts.length >= 3) {
      alert("Library full! You can only save up to 3 manuscripts. Please delete one from your library to save this one.");
      return false;
    }
    
    // Check if already saved (simple check by title)
    const exists = savedManuscripts.some(book => book.title === ebookToSave.title);
    if (exists) {
        if(!confirm("A manuscript with this title already exists. Do you want to overwrite it?")) {
            return false;
        }
        // Remove old version
        const filtered = savedManuscripts.filter(book => book.title !== ebookToSave.title);
        const updated = [...filtered, ebookToSave];
        setSavedManuscripts(updated);
        localStorage.setItem('ebook-generator-library', JSON.stringify(updated));
        return true;
    }

    const updatedLibrary = [...savedManuscripts, ebookToSave];
    setSavedManuscripts(updatedLibrary);
    localStorage.setItem('ebook-generator-library', JSON.stringify(updatedLibrary));
    return true;
  }, [savedManuscripts]);

  const handleDeleteManuscript = useCallback((index: number) => {
    if(confirm("Are you sure you want to delete this manuscript?")) {
        const updatedLibrary = savedManuscripts.filter((_, i) => i !== index);
        setSavedManuscripts(updatedLibrary);
        localStorage.setItem('ebook-generator-library', JSON.stringify(updatedLibrary));
    }
  }, [savedManuscripts]);

  const handleLoadManuscript = useCallback((ebook: Ebook) => {
    setEbookData(ebook);
    setStep('result');
  }, []);

  const handleViewLibrary = useCallback(() => {
    setStep('library');
  }, []);

  const renderContent = () => {
    switch(step) {
        case 'sign_up':
            return <SignUpForm onSignUp={handleSignUp} />;
        case 'idea':
            return (
                <BookIdeaForm 
                    onSubmit={handleIdeaSubmit} 
                    isLoading={false} 
                />
            );
        case 'generating_titles':
            return <LoadingSpinner message="Generating title ideas..." />;
        case 'title_selection':
            return <TitleSelectionForm suggestions={titleSuggestions} idea={idea} onSelect={handleTitleSelect} />;
        case 'details':
            return <BookDetailsForm onSubmit={handleDetailsSubmit} topic={selectedTitle} isLoading={false} />;
        case 'generating':
            return <LoadingSpinner message="Generating your eBook outline..." />;
        case 'library':
            return (
                <Library 
                    manuscripts={savedManuscripts} 
                    onLoad={handleLoadManuscript} 
                    onDelete={handleDeleteManuscript} 
                    onBack={handleReset}
                />
            );
        case 'error':
            return (
                <div className="text-center text-red-400 bg-red-900/50 p-6 rounded-lg max-w-2xl mx-auto">
                  <h2 className="text-xl font-bold mb-2">Oops! Something went wrong.</h2>
                  <p>{error}</p>
                   <button
                     onClick={handleReset}
                     className="mt-4 py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
                   >
                     Try Again
                   </button>
                </div>
              );
        case 'result':
            if (ebookData) {
                return (
                    <EbookResult 
                        data={ebookData} 
                        onReset={handleReset} 
                        onSave={handleSaveManuscript}
                    />
                );
            }
            // Fallback if ebookData is null
            setStep('error');
            setError('Could not display ebook data.');
            return null;
        default:
            return (
                <BookIdeaForm 
                    onSubmit={handleIdeaSubmit} 
                    isLoading={false} 
                />
            );
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 text-white flex flex-col font-sans">
      {step !== 'sign_up' && (
        <header className="w-full px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
           <button 
             onClick={handleReset} 
             className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 hover:opacity-80 transition-opacity"
           >
              5-Min eBook
           </button>
           
           <div className="flex items-center gap-3">
             {step !== 'library' && (
               <button 
                  onClick={handleViewLibrary}
                  className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 py-2 px-4 rounded-full transition-all border border-slate-700 group"
               >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 group-hover:text-blue-400 transition-colors">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                  </svg>
                  <span>Library <span className="text-slate-500 group-hover:text-slate-400">({savedManuscripts.length}/3)</span></span>
               </button>
             )}
             
             <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-red-400 bg-transparent hover:bg-slate-800 py-2 px-3 rounded-full transition-all"
                title="Sign Out"
             >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                </svg>
             </button>
           </div>
        </header>
      )}

      <main className="flex-grow flex items-center justify-center p-4 sm:p-8 relative">
        <div className="w-full">
          {renderContent()}
        </div>
      </main>

      <footer className="w-full py-6 text-center text-slate-500 text-sm border-t border-slate-800 mt-auto bg-slate-900/80 backdrop-blur-sm">
        <p>&copy; {new Date().getFullYear()} The 5-Minute eBook Generator. All rights reserved.</p>
        <p className="mt-1">Powered by Google Gemini</p>
      </footer>
    </div>
  );
};

export default App;
