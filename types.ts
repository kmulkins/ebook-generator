
export type TrimSize = '5x8' | '5.5x8.5' | '6x9' | '8.5x11';
export type FontChoice = 'Garamond' | 'Helvetica' | 'Times New Roman' | 'Courier';

export interface Chapter {
  title: string;
  contentPoints: string[];
  illustrationPrompt: string;
  fullContent?: string;
}

export interface Ebook {
  title:string;
  subtitle?: string;
  author: string;
  dedication?: string;
  coverImagePrompt: string;
  chapters: Chapter[];
  trimSize: TrimSize;
  font: FontChoice;
}
