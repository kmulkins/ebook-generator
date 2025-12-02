
import { GoogleGenAI, Type } from "@google/genai";
import { Ebook, TrimSize, FontChoice } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// --- Retry Logic Helper ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const runWithRetry = async <T>(fn: () => Promise<T>, retries = 5, baseDelay = 3000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const msg = error?.message || JSON.stringify(error);
    const isQuotaError = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Quota') || msg.includes('limit');
    const isServerOverload = msg.includes('503') || msg.includes('Overloaded');
    
    if (retries > 0 && (isQuotaError || isServerOverload)) {
      console.warn(`API Busy/Quota hit. Retrying in ${baseDelay}ms... (${retries} retries left)`);
      await delay(baseDelay);
      return runWithRetry(fn, retries - 1, baseDelay * 1.5); // Exponential backoff
    }
    throw error;
  }
};
// --------------------------

const titleSuggestionsSchema = {
    type: Type.OBJECT,
    properties: {
        titles: {
            type: Type.ARRAY,
            description: "An array of 10 catchy and compelling title suggestions for an ebook.",
            items: {
                type: Type.STRING
            }
        }
    },
    required: ["titles"]
};

export const generateTitleSuggestions = async (topic: string): Promise<string[]> => {
    return runWithRetry(async () => {
        try {
            const prompt = `Based on the following topic, generate 10 catchy and marketable title suggestions for an ebook.\n\nTopic: "${topic}"`;
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    systemInstruction: "You are a creative author and marketing expert specializing in creating irresistible book titles.",
                    responseMimeType: "application/json",
                    responseSchema: titleSuggestionsSchema,
                },
            });
            
            if (!response.text) {
                throw new Error("API returned empty response (possibly blocked by safety settings).");
            }

            let text = response.text.trim();
            if (text.startsWith('```json')) {
            text = text.slice(7, -3).trim();
            } else if (text.startsWith('```')) {
            text = text.slice(3, -3).trim();
            }
            const result = JSON.parse(text);
            return result.titles || [];
        } catch (error) {
            console.error("Error generating title suggestions:", error);
            if (error instanceof Error) {
                throw new Error(`Failed to generate title suggestions: ${error.message}`);
            }
            throw new Error("An unknown error occurred while generating title suggestions.");
        }
    });
};

const ebookSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A catchy and compelling title for the ebook based on the topic and details provided."
    },
    subtitle: {
        type: Type.STRING,
        description: "An engaging, short, and punchy subtitle (maximum 10 words) that clarifies the main title."
    },
    coverImagePrompt: {
        type: Type.STRING,
        description: "A detailed, visually rich prompt for an AI image generator to create a stunning book cover, reflecting the book's topic and tone. The prompt should be suitable for a book cover."
    },
    chapters: {
      type: Type.ARRAY,
      description: "An array of 15 to 20 chapters for the ebook, starting with an Introduction and ending with a Conclusion. The chapters should comprehensively cover the topic for the specified audience.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "The title of the chapter. This title should NOT include the word 'Chapter' or any number."
          },
          contentPoints: {
            type: Type.ARRAY,
            description: "An array of 5 to 7 key points or topics to be covered in this chapter, providing enough depth for substantial content.",
            items: {
              type: Type.STRING
            }
          },
          illustrationPrompt: {
            type: Type.STRING,
            description: "A detailed, visually rich prompt for an AI image generator to create a stunning illustration relevant to this chapter's content."
          }
        },
        required: ["title", "contentPoints", "illustrationPrompt"]
      }
    }
  },
  required: ["title", "subtitle", "coverImagePrompt", "chapters"]
};

export interface EbookGenerationDetails {
    topic: string;
    author: string;
    audience: string;
    takeaways: string;
    tone: string;
    dedication?: string;
    trimSize: TrimSize;
    font: FontChoice;
}


export const generateEbook = async (details: EbookGenerationDetails): Promise<Ebook> => {
  return runWithRetry(async () => {
    try {
        const prompt = `Generate a complete outline for a compelling, long-form ebook designed to be approximately 80 pages. The final title has been decided.

        **eBook Title:** "${details.topic}"
        **Target Audience:** ${details.audience}
        **Key Takeaways for the Reader:** ${details.takeaways}
        **Desired Tone:** ${details.tone}

        Based on these details, create an ebook outline with:
        1. An engaging, **short, and punchy subtitle** (under 10 words) that clarifies the title.
        2. A visually rich **cover image prompt** that matches the given title.
        3. A structure of **15-20 chapters**, starting with an "Introduction" and ending with a "Conclusion".
        4. For each chapter, provide a clear **title** (this title should NOT include the word "Chapter" or any chapter number), **5-7 detailed content points**, and a concept for an **illustration**. The content points should be substantial enough to be expanded into about 1200 words each.
        
        IMPORTANT: Do not generate your own title. Use the exact title provided: "${details.topic}". The 'title' field in the JSON output must be exactly this.`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "You are an expert author and marketer. You create high-quality, long-form ebook outlines that are authoritative yet accessible. The output must be a JSON object that strictly adheres to the provided schema.",
                responseMimeType: "application/json",
                responseSchema: ebookSchema,
            },
        });

        if (!response.text) {
             throw new Error("API returned empty response for eBook outline.");
        }

        let text = response.text.trim();
        if (text.startsWith('```json')) {
        text = text.slice(7, -3).trim();
        } else if (text.startsWith('```')) {
        text = text.slice(3, -3).trim();
        }
        const ebookOutline = JSON.parse(text);

        const completeEbookData: Ebook = {
            ...ebookOutline,
            author: details.author,
            dedication: details.dedication || '',
            trimSize: details.trimSize,
            font: details.font,
        };
        return completeEbookData;

    } catch (error) {
        console.error("Error generating eBook:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate eBook content: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the eBook.");
    }
  });
};

export const generateImage = async (prompt: string, aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9' = '4:3'): Promise<string> => {
  return runWithRetry(async () => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `A vibrant digital illustration for an ebook. ${prompt}`,
            config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio,
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
        throw new Error("No image was generated.");
        }
    } catch (error) {
        console.error("Error generating image:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate image: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the image.");
    }
  }, 3, 3000); // 3 retries, start with 3s delay for images
};

export const generateChapterContent = async (
    chapterTitle: string,
    contentPoints: string[],
    bookTitle: string
  ): Promise<string> => {
    return runWithRetry(async () => {
        try {
        const prompt = `Write the full content for a chapter of an ebook titled "${bookTitle}".
    The chapter is titled "${chapterTitle}".
    The key points to cover are: ${contentPoints.join(', ')}.

    Write approximately 1200-1500 words of engaging, informative, and well-structured content.
    The output should be plain text, formatted with paragraphs separated by newlines. Ensure the content is deep and comprehensive, suitable for a full-length book chapter.`;
    
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "You are a professional author. The tone of your writing should be authoritative yet accessible."
            }
        });
    
        if (!response?.text) {
            throw new Error("API returned an empty or invalid response for chapter content.");
        }
        return response.text.trim();

        } catch (error) {
        console.error(`Error generating content for chapter "${chapterTitle}":`, error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate chapter content: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the chapter content.");
        }
    });
  };


export const proofreadText = async (text: string): Promise<string> => {
    return runWithRetry(async () => {
        try {
        const prompt = `Please proofread the following text for any spelling and grammar errors. 
        Correct any mistakes you find. 
        Return ONLY the corrected text, without any introductory phrases, explanations, or markdown formatting.
        
        Original text:
        ---
        ${text}
        ---
        `;
    
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
            systemInstruction: "You are an expert proofreader and editor. Your task is to correct text meticulously for spelling and grammar, returning only the clean, corrected version."
            }
        });
    
        if (!response?.text) {
            throw new Error("API returned an empty or invalid response for proofreading.");
        }
        
        let cleanedText = response.text.trim();
        // Remove markdown code blocks if present (common with LLMs even when asked not to)
        if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/^```(?:markdown|text)?\n?/, '').replace(/\n?```$/, '');
        }
        return cleanedText.trim();
    
        } catch (error) {
        console.error("Error proofreading text:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to proofread text: ${error.message}`);
        }
        throw new Error("An unknown error occurred while proofreading the text.");
        }
    });
  };
