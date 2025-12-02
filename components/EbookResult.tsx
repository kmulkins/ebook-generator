
import React, { useState, useEffect, useMemo } from 'react';
import { Ebook, Chapter, TrimSize } from '../types';
import ChapterCard from './ChapterCard';
import { generateImage, generateChapterContent, proofreadText } from '../services/geminiService';
import { generatePdf } from '../services/pdfService';
import { generateEpub } from '../services/epubService';
import PreviewModal from './PreviewModal';

interface EbookResultProps {
  data: Ebook;
  onReset: () => void;
  onSave: (ebook: Ebook) => boolean;
}

declare const jspdf: any;

const EbookResult: React.FC<EbookResultProps> = ({ data, onReset, onSave }) => {
  const [ebook, setEbook] = useState<Ebook>(data);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isDownloadingEpub, setIsDownloadingEpub] = useState<boolean>(false);
  const [isDownloadingCover, setIsDownloadingCover] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isGeneratingCover, setIsGeneratingCover] = useState<boolean>(false);
  const [coverImageError, setCoverImageError] = useState<string | null>(null);
  const [editableCoverPrompt, setEditableCoverPrompt] = useState<string>(data.coverImagePrompt);
  const [isEditingCoverPrompt, setIsEditingCoverPrompt] = useState<boolean>(false);

  const [chapterImages, setChapterImages] = useState<(string | null | undefined)[]>([]);
  const [chapterImageErrors, setChapterImageErrors] = useState<(string | null)[]>([]);
  const [isGeneratingChapterImages, setIsGeneratingChapterImages] = useState<boolean>(false);
  // Track individual loading states for chapters
  const [generatingChapterIndices, setGeneratingChapterIndices] = useState<Set<number>>(new Set());

  const [writingState, setWritingState] = useState<{
    inProgress: boolean;
    currentChapter: number | null;
    completed: boolean;
  }>({ inProgress: false, currentChapter: null, completed: false });
  
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const isAnyDownloading = isDownloading || isDownloadingEpub || isDownloadingCover;

  const isReadyToDownload = useMemo(() => {
    return (
        writingState.completed &&
        !isGeneratingChapterImages &&
        !isGeneratingCover
    );
  }, [writingState.completed, isGeneratingChapterImages, isGeneratingCover]);

  const getFriendlyErrorMessage = (error: unknown): string => {
    let errMsg = 'An unknown error occurred.';
    if (error instanceof Error) {
        try {
            const parsedError = JSON.parse(error.message);
            if (parsedError?.error?.message) {
                errMsg = parsedError.error.message;
            } else {
                errMsg = error.message;
            }
        } catch (e) {
            errMsg = error.message;
        }
    }
    
    if (errMsg.includes('limit: 0')) {
        return 'Image generation unavailable (Quota limit is 0). Check your plan.';
    }
    if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('429')) {
         return 'Quota exceeded. Retrying shortly...';
    }
    return errMsg;
  };

  useEffect(() => {
    // Reset state when data changes (e.g. loading a new book)
    setEbook(data);
    setEditableCoverPrompt(data.coverImagePrompt);
    setIsSaved(false);
    
    // Initialize states based on data
    setChapterImages(Array(data.chapters.length).fill(undefined));
    setChapterImageErrors(Array(data.chapters.length).fill(null));
    setGeneratingChapterIndices(new Set());

    const generateCover = async () => {
        // Generate Cover Image
        setIsGeneratingCover(true);
        setCoverImageError(null);
        try {
            const url = await generateImage(data.coverImagePrompt, '3:4');
            setCoverImageUrl(url);
        } catch (err) {
            console.error('Failed to generate cover image.', err);
            setCoverImageError(getFriendlyErrorMessage(err));
        } finally {
            setIsGeneratingCover(false);
        }
    };

    if (data.chapters && !coverImageUrl) {
        // Only generate Cover automatically to save quota. 
        // Chapter images are now manual.
        generateCover();
    }
    
    // Check if chapters are already written (e.g. loaded from save)
    const allChaptersWritten = data.chapters.every(ch => !!ch.fullContent);
    if (allChaptersWritten) {
        setWritingState({ inProgress: false, currentChapter: null, completed: true });
    } else {
        setWritingState({ inProgress: false, currentChapter: null, completed: false });
    }

  }, [data]);

  const handleGenerateChapterImage = async (index: number) => {
    if (generatingChapterIndices.has(index)) return;

    setGeneratingChapterIndices(prev => new Set(prev).add(index));
    setChapterImageErrors(prev => {
        const newErrors = [...prev];
        newErrors[index] = null;
        return newErrors;
    });

    try {
        const prompt = ebook.chapters[index].illustrationPrompt;
        const url = await generateImage(prompt, '4:3');
        setChapterImages(prev => {
            const newImages = [...prev];
            newImages[index] = url;
            return newImages;
        });
    } catch (err) {
        console.error(`Failed to generate image for chapter ${index + 1}`, err);
        setChapterImageErrors(prev => {
            const newErrors = [...prev];
            newErrors[index] = getFriendlyErrorMessage(err);
            return newErrors;
        });
    } finally {
        setGeneratingChapterIndices(prev => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
        });
    }
  };

  const handleWriteEbook = async () => {
    setWritingState({ inProgress: true, currentChapter: 0, completed: false });
    const updatedChapters: Chapter[] = [...ebook.chapters];
  
    for (let i = 0; i < updatedChapters.length; i++) {
      if (!updatedChapters[i].fullContent) {
        setWritingState(prev => ({ ...prev, currentChapter: i }));
        try {
          const content = await generateChapterContent(
            updatedChapters[i].title,
            updatedChapters[i].contentPoints,
            ebook.title
          );
          updatedChapters[i] = { ...updatedChapters[i], fullContent: content };
          setEbook(prev => ({ ...prev, chapters: [...prev.chapters.slice(0, i), updatedChapters[i], ...prev.chapters.slice(i+1)]}));
        } catch (error) {
          console.error(`Failed to generate content for chapter ${i + 1}`, error);
        }
        // Add a delay between chapters to avoid rate limits (RPM)
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  
    setWritingState({ inProgress: false, currentChapter: null, completed: true });
  };

  const handleRegenerateCover = async () => {
    if (!editableCoverPrompt.trim()) {
      alert('The cover prompt cannot be empty.');
      return;
    }
    setIsEditingCoverPrompt(false);
    setIsGeneratingCover(true);
    setCoverImageError(null);
    setCoverImageUrl(null);
    try {
      const url = await generateImage(editableCoverPrompt, '3:4');
      setCoverImageUrl(url);
      setEbook(prev => ({ ...prev, coverImagePrompt: editableCoverPrompt }));
    } catch (err) {
      console.error('Failed to regenerate cover image.', err);
      setCoverImageError(getFriendlyErrorMessage(err));
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const handleDownloadCover = async () => {
    if (!coverImageUrl) {
        alert("Cover image is not available to download.");
        return;
    }
    setIsDownloadingCover(true);
    try {
        const { jsPDF } = jspdf;
        const { trimSize, title, author } = ebook;

        const getPdfDimensions = (size: TrimSize): [number, number] => {
            switch (size) {
                case '5x8': return [127, 203.2];
                case '5.5x8.5': return [139.7, 215.9];
                case '6x9': return [152.4, 228.6];
                default: return [139.7, 215.9];
            }
        };

        const [width, height] = getPdfDimensions(trimSize);
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: [width, height]
        });

        doc.addImage(coverImageUrl, 'JPEG', 0, 0, width, height);

        // --- Add Title to Top ---
        doc.setFont('times', 'bold');
        doc.setFontSize(32);
        const titleMaxWidth = width * 0.8;
        const titleLines = doc.splitTextToSize(title, titleMaxWidth);
        
        // Add shadow for title for readability
        doc.setTextColor('#000000'); // Shadow color
        doc.text(titleLines, width / 2 + 0.5, 30.5, { align: 'center' });
        
        // Add main title text
        doc.setTextColor('#FFFFFF'); // Main text color
        doc.text(titleLines, width / 2, 30, { align: 'center' });


        // --- Add Author Name to Bottom ---
        doc.setFontSize(18);
        doc.setFont('times', 'normal');
        
        // Add a subtle shadow for readability on any background
        doc.setTextColor('#000000'); // Shadow color
        doc.text(author, width / 2 + 0.5, height - 24.5, { align: 'center' });
        
        doc.setTextColor('#FFFFFF'); // Main text color
        doc.text(author, width / 2, height - 25, { align: 'center' });

        const filename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        doc.save(`${filename}_cover.pdf`);
    } catch (error) {
        console.error("Failed to generate cover PDF:", error);
        alert("Sorry, there was an error creating the cover PDF.");
    } finally {
        setIsDownloadingCover(false);
    }
};

  const handleDownload = async () => {
    if (!isReadyToDownload) {
        alert("Please wait for the eBook content to be generated before downloading. Images are optional but content is required.");
        return;
    }
    
    setIsDownloading(true);
    try {
        const finalImageUrls = chapterImages.map(url => url ?? null);
        await generatePdf(ebook, finalImageUrls);
    } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("Sorry, there was an error creating the PDF.");
    } finally {
        setIsDownloading(false);
    }
  };

  const handleDownloadEpub = async () => {
    if (!isReadyToDownload) {
      alert("Please wait for the eBook content to be generated before downloading. Images are optional but content is required.");
      return;
    }
    setIsDownloadingEpub(true);
    try {
      const finalImageUrls = chapterImages.map(url => url ?? null);
      await generateEpub(ebook, finalImageUrls);
    } catch (error) {
      console.error("Failed to generate EPUB:", error);
      alert("Sorry, there was an error creating the EPUB file.");
    } finally {
      setIsDownloadingEpub(false);
    }
  };

  const handleSaveClick = () => {
    const success = onSave(ebook);
    if (success) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const handleChapterContentChange = (chapterIndex: number, newContent: string) => {
    const updatedChapters = [...ebook.chapters];
    updatedChapters[chapterIndex] = { ...updatedChapters[chapterIndex], fullContent: newContent };
    setEbook(prev => ({ ...prev, chapters: updatedChapters }));
  };
  
  const handleProofreadChapter = async (chapterIndex: number) => {
    const chapter = ebook.chapters[chapterIndex];
    if (!chapter || !chapter.fullContent) return;
    try {
      const correctedContent = await proofreadText(chapter.fullContent);
      handleChapterContentChange(chapterIndex, correctedContent);
    } catch (error) {
      console.error(`Failed to proofread chapter ${chapterIndex + 1}:`, error);
      alert(`An error occurred while proofreading Chapter ${chapterIndex + 1}.`);
    }
  };


  return (
    <>
    <div className="w-full max-w-6xl mx-auto animate-fade-in pb-12">
        <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{ebook.title}</h1>
            {ebook.subtitle && (
                <h2 className="text-xl md:text-2xl text-blue-300 font-medium mb-2">{ebook.subtitle}</h2>
            )}
            <p className="text-lg text-slate-400">by {ebook.author}</p>
        </div>

        <div className='mb-12 max-w-sm mx-auto bg-slate-800/50 border border-slate-700 p-4 rounded-lg shadow-2xl'>
            <h2 className="text-xl font-bold text-white mb-4 text-center">eBook Cover</h2>
            <div className="aspect-[3/4] bg-slate-700/50 rounded-lg shadow-lg flex items-center justify-center text-slate-400">
                {isGeneratingCover && (
                    <div className="w-full h-full bg-slate-700 rounded-lg animate-pulse flex flex-col items-center justify-center p-4 text-center">
                        <svg className="w-10 h-10 mb-2 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                        <span>Generating cover...</span>
                    </div>
                )}
                {coverImageError && (
                    <div className="text-center text-red-400 p-4">
                        <p className="font-semibold">Cover Failed</p>
                        <p className="text-sm">{coverImageError}</p>
                    </div>
                )}
                {coverImageUrl && (
                    <img src={coverImageUrl} alt={ebook.coverImagePrompt} className="w-full h-full object-cover rounded-lg" />
                )}
            </div>
            <div className="mt-3 text-center">
                {isEditingCoverPrompt ? (
                    <div className="space-y-2">
                        <textarea
                            value={editableCoverPrompt}
                            onChange={(e) => setEditableCoverPrompt(e.target.value)}
                            className="w-full h-24 p-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition resize-none text-sm"
                            aria-label="Edit cover prompt"
                        />
                        <div className="flex justify-center gap-2">
                            <button
                                onClick={handleRegenerateCover}
                                disabled={isGeneratingCover}
                                className="py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md shadow-sm transition-all disabled:opacity-50"
                            >
                                Save & Regenerate
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditingCoverPrompt(false);
                                    setEditableCoverPrompt(ebook.coverImagePrompt);
                                }}
                                className="py-1 px-3 bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold rounded-md shadow-sm transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-2 px-2">
                        <p className="text-sm text-slate-400 italic flex-1">
                            "{ebook.coverImagePrompt}"
                        </p>
                        <button onClick={() => setIsEditingCoverPrompt(true)} className="p-1 rounded-full hover:bg-slate-700 transition-colors flex-shrink-0" aria-label="Edit cover prompt">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400">
                                <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
            <div className="mt-4">
              <button
                onClick={handleDownloadCover}
                disabled={!coverImageUrl || isAnyDownloading}
                className="w-full flex justify-center items-center py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isDownloadingCover ? 'Generating PDF...' : 'Download Cover PDF'}
              </button>
            </div>
        </div>
        
        {/* Write eBook Section */}
        {!writingState.completed && !writingState.inProgress && (
            <div className="bg-slate-800/80 border border-blue-600 p-8 rounded-xl shadow-2xl mb-12 text-center max-w-2xl mx-auto backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-white mb-3">Your Outline is Ready!</h2>
                <p className="text-slate-300 mb-6">The structure is set. Now, let's write the content for all {ebook.chapters.length} chapters.</p>
                <button
                    onClick={handleWriteEbook}
                    className="py-4 px-10 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white text-xl font-bold rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                    Start Writing eBook
                </button>
            </div>
        )}

        {writingState.inProgress && (
             <div className="fixed bottom-8 right-8 z-50 bg-slate-800 border border-slate-700 p-4 rounded-lg shadow-2xl flex items-center gap-4 animate-slide-up">
                 <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                 <div>
                     <p className="font-semibold text-white">Writing Chapter {writingState.currentChapter !== null ? writingState.currentChapter + 1 : ''}...</p>
                     <p className="text-xs text-slate-400">Do not close this tab.</p>
                 </div>
             </div>
        )}

        <div className="space-y-8">
            {ebook.chapters.map((chapter, index) => (
            <ChapterCard
                key={index}
                index={index}
                chapter={chapter}
                isWriting={writingState.inProgress && writingState.currentChapter === index}
                imageUrl={chapterImages[index] || null}
                isGeneratingImage={generatingChapterIndices.has(index)}
                imageError={chapterImageErrors[index] || null}
                onContentChange={(newContent) => handleChapterContentChange(index, newContent)}
                onProofread={() => handleProofreadChapter(index)}
                onGenerateImage={() => handleGenerateChapterImage(index)}
            />
            ))}
        </div>

        {/* Actions Footer */}
        <div className="mt-12 sticky bottom-4 z-40 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-700 shadow-2xl flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex gap-4">
                 <button
                    onClick={() => setShowPreview(true)}
                    className="py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg shadow-md transition-all flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                    Preview
                </button>
                <button
                    onClick={handleSaveClick}
                    disabled={isSaved}
                    className={`py-3 px-6 ${isSaved ? 'bg-green-600' : 'bg-slate-700 hover:bg-slate-600'} text-white font-bold rounded-lg shadow-md transition-all flex items-center gap-2`}
                >
                    {isSaved ? (
                        <>
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        Saved!
                        </>
                    ) : (
                        <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                        </svg>
                        Save to Library
                        </>
                    )}
                </button>
            </div>
            
            <div className="flex gap-4 w-full md:w-auto">
                <button
                    onClick={handleDownloadEpub}
                    disabled={isAnyDownloading || !isReadyToDownload}
                    className="flex-1 md:flex-none py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                     {isDownloadingEpub ? (
                        <span className="animate-pulse">Creating EPUB...</span>
                    ) : (
                        <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                        </svg>
                        Download EPUB
                        </>
                    )}
                </button>
                <button
                    onClick={handleDownload}
                    disabled={isAnyDownloading || !isReadyToDownload}
                    className="flex-1 md:flex-none py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                    {isDownloading ? (
                        <span className="animate-pulse">Creating PDF...</span>
                    ) : (
                        <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Download PDF
                        </>
                    )}
                </button>
            </div>
        </div>
    </div>
    
    {showPreview && (
        <PreviewModal ebook={ebook} onClose={() => setShowPreview(false)} />
    )}
    </>
  );
};

export default EbookResult;
