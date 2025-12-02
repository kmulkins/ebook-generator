
import { Ebook, TrimSize, FontChoice } from '../types';

declare const jspdf: any;

const toRoman = (num: number): string => {
    if (num < 1 || num > 3999) return String(num); // Handle out of range
    const roman = {
        'm': 1000, 'cm': 900, 'd': 500, 'cd': 400,
        'c': 100, 'xc': 90, 'l': 50, 'xl': 40,
        'x': 10, 'ix': 9, 'v': 5, 'iv': 4, 'i': 1
    };
    let str = '';
    for (let i of Object.keys(roman)) {
        let q = Math.floor(num / roman[i as keyof typeof roman]);
        num -= q * roman[i as keyof typeof roman];
        str += i.repeat(q);
    }
    return str;
};

const getPdfDimensions = (trimSize: TrimSize): [number, number] => {
    // 1 inch = 25.4 mm
    switch (trimSize) {
        case '5x8':
            return [127, 203.2]; // 5" x 8"
        case '5.5x8.5':
            return [139.7, 215.9]; // 5.5" x 8.5"
        case '6x9':
            return [152.4, 228.6]; // 6" x 9"
        case '8.5x11':
            return [215.9, 279.4]; // 8.5" x 11"
        default:
            return [139.7, 215.9]; // Default to 5.5" x 8.5"
    }
};

const getJsPdfFont = (font: FontChoice): string => {
    switch (font) {
        case 'Garamond':
        case 'Times New Roman':
            return 'times';
        case 'Helvetica':
            return 'helvetica';
        case 'Courier':
            return 'courier';
        default:
            return 'times';
    }
};

export const generatePdf = async (ebookData: Ebook, chapterImageUrls: (string | null)[]): Promise<void> => {
  const { jsPDF } = jspdf;
  const [width, height] = getPdfDimensions(ebookData.trimSize);

  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: [width, height]
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Margins for professional printing (e.g., 0.75" inner, 0.5" outer/top/bottom)
  const innerMargin = 19.05; // Gutter for binding
  const outerMargin = 12.7;
  const topMargin = 19.05; // Taller top margin
  const bottomMargin = 19.05;
  const contentWidth = pageWidth - innerMargin - outerMargin;

  const tocEntries: { title: string, page: number }[] = [];
  const chapterStartPages = new Set<number>();
  const blankPages = new Set<number>(); // For robust blank page detection
  
  const bodyFont = getJsPdfFont(ebookData.font);

  const addFlowingText = (text: string, startY: number): number => {
    const fontSize = 11; // Standard book font size
    doc.setFont(bodyFont, 'normal').setFontSize(fontSize);
    const lineHeight = fontSize * 0.55; // Approx 1.4 line height for readability
    const indent = 5; // A reasonable paragraph indent
    
    const paragraphs = text.split('\n').filter(p => p.trim() !== '');
    let cursorY = startY;
    
    paragraphs.forEach((paragraph) => {
      // Split the paragraph into lines that fit the content width
      const lines = doc.splitTextToSize(paragraph, contentWidth);

      lines.forEach((line: string, lineIndex: number) => {
          // Check if we need a new page
          if (cursorY + lineHeight > pageHeight - bottomMargin) {
              doc.addPage();
              cursorY = topMargin;
          }
          const isFirstLineOfParagraph = lineIndex === 0;
          const isEvenPage = doc.internal.getNumberOfPages() % 2 === 0;
          
          // Verso (left, even) pages have gutter on the right. Content starts at outerMargin.
          // Recto (right, odd) pages have gutter on the left. Content starts at innerMargin.
          const xMargin = isEvenPage ? outerMargin : innerMargin;
          // Apply indent only to the first line of the paragraph
          const xPos = isFirstLineOfParagraph ? xMargin + indent : xMargin;
          const effectiveWidth = contentWidth - (isFirstLineOfParagraph ? indent : 0);

          doc.text(line, xPos, cursorY, { maxWidth: effectiveWidth, baseline: 'top' });
          cursorY += lineHeight;
      });
      // No extra space between paragraphs for traditional look
    });
    return cursorY;
  };
  
  let displayTitle = ebookData.title;

  // --- PAGE 1: HALF TITLE PAGE (Front matter i) ---
  doc.setTextColor(0, 0, 0);
  let titleOnlyPageY = pageHeight / 3;
  doc.setFontSize(24).setFont('times', 'bold');
  const titleOnlyLines = doc.splitTextToSize(displayTitle, contentWidth * 0.8);
  doc.text(titleOnlyLines, pageWidth / 2, titleOnlyPageY, { align: 'center' });

  // --- PAGE 2: BLANK (Front matter ii) ---
  doc.addPage();
  blankPages.add(2);

  // --- PAGE 3: FULL TITLE PAGE (Front matter iii) ---
  doc.addPage();
  doc.setTextColor(0, 0, 0);
  let titlePageY = pageHeight / 3;
  doc.setFontSize(28).setFont('times', 'bold');
  const titleLines = doc.splitTextToSize(displayTitle, contentWidth);
  doc.text(titleLines, pageWidth / 2, titlePageY, { align: 'center' });
  titlePageY += titleLines.length * (28 * 0.45); 

  if (ebookData.subtitle) {
    titlePageY += 10;
    doc.setFontSize(18).setFont('times', 'normal');
    const subtitleLines = doc.splitTextToSize(ebookData.subtitle, contentWidth);
    doc.text(subtitleLines, pageWidth / 2, titlePageY, { align: 'center' });
  }

  doc.setFontSize(16).setFont('times', 'normal');
  doc.text(`by ${ebookData.author}`, pageWidth / 2, pageHeight - 50, { align: 'center' });
 
  // --- PAGE 4: COPYRIGHT/DEDICATION (Front matter iv) ---
  doc.addPage();
  if (ebookData.dedication) {
      doc.setFontSize(12).setFont('times', 'italic');
      const dedicationLines = doc.splitTextToSize(ebookData.dedication, contentWidth);
      doc.text(dedicationLines, pageWidth / 2, pageHeight / 2, { align: 'center' });
  }

  // --- TABLE OF CONTENTS ---
  const tocPageNumber = doc.internal.getNumberOfPages() + 1;
  doc.addPage(); 

  // Ensure main content starts on a recto page.
  let preliminaryChapter1StartPage = doc.internal.getNumberOfPages();
  if (preliminaryChapter1StartPage % 2 !== 0) {
      preliminaryChapter1StartPage++;
  }
  preliminaryChapter1StartPage++;


  // --- CHAPTERS ---
  ebookData.chapters.forEach((chapter, index) => {
    // Ensure each chapter starts on a recto (right-hand, odd) page.
    if (doc.internal.getNumberOfPages() % 2 !== 0) {
        doc.addPage(); 
        blankPages.add(doc.internal.getNumberOfPages());
    }
    doc.addPage();
    const currentPageNum = doc.internal.getNumberOfPages();
    chapterStartPages.add(currentPageNum);
    
    tocEntries.push({ title: `Chapter ${index + 1}: ${chapter.title}`, page: currentPageNum });

    let yPos = topMargin + 20;
    const xMargin = innerMargin; 

    doc.setFont('times', 'bold').setFontSize(20);
    const chapterTitleLines = doc.splitTextToSize(`Chapter ${index + 1}: ${chapter.title}`, contentWidth);
    doc.text(chapterTitleLines, xMargin, yPos, { maxWidth: contentWidth });
    yPos += chapterTitleLines.length * 10 + 20; 

    const chapterImgUrl = chapterImageUrls[index];
    if (chapterImgUrl) {
        if (yPos > pageHeight - bottomMargin - 80) { 
            doc.addPage();
            yPos = topMargin;
        }
        const chapImgWidth = contentWidth * 0.8;
        const chapImgHeight = (chapImgWidth / 4) * 3;
        const chapImgX = xMargin + (contentWidth - chapImgWidth) / 2;
        doc.addImage(chapterImgUrl, 'JPEG', chapImgX, yPos, chapImgWidth, chapImgHeight);
        yPos += chapImgHeight + 15;
    }

    if (chapter.fullContent) {
        if (yPos > pageHeight - bottomMargin - 40) { 
            doc.addPage();
            yPos = topMargin;
        }
        addFlowingText(chapter.fullContent, yPos);
    }
  });

  const finalChapter1StartPage = tocEntries[0]?.page || preliminaryChapter1StartPage;

  // --- RENDER TABLE OF CONTENTS ---
  doc.setPage(tocPageNumber);
  doc.setFont('times', 'bold').setFontSize(22);
  doc.text('Table of Contents', pageWidth / 2, topMargin, { align: 'center' });

  let tocY = topMargin + 20;
  doc.setFont('times', 'normal').setFontSize(12);
  const tocXMargin = innerMargin; 

  tocEntries.forEach(entry => {
    if (tocY > pageHeight - bottomMargin) {
        doc.addPage();
        tocY = topMargin;
    }
    const displayPageNum = entry.page - finalChapter1StartPage + 1;
    const titleWidth = doc.getStringUnitWidth(entry.title) * doc.getFontSize() / doc.internal.scaleFactor;
    const pageNumWidth = doc.getStringUnitWidth(String(displayPageNum)) * doc.getFontSize() / doc.internal.scaleFactor;
    const availableWidth = contentWidth - titleWidth - pageNumWidth;
    const dots = '.'.repeat(Math.max(0, Math.floor(availableWidth / (doc.getStringUnitWidth('.') * doc.getFontSize() / doc.internal.scaleFactor)) - 2));

    doc.text(`${entry.title} ${dots} ${displayPageNum}`, tocXMargin, tocY, {maxWidth: contentWidth});
    tocY += 8;
  });

  // --- ADD PAGE NUMBERS AND HEADERS ---
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('times', 'normal');
    
    // Skip headers/footers on pages that should be clean.
    if (blankPages.has(i) || chapterStartPages.has(i) || i === 1 || i === 3 || i === 4) {
        continue;
    }

    const isEvenPage = i % 2 === 0;
    let pageNumStr = '';

    if (i >= finalChapter1StartPage) {
        const mainContentPageNum = i - finalChapter1StartPage + 1;
        pageNumStr = String(mainContentPageNum);

        // Add Headers (Running Heads)
        doc.setFontSize(9);
        const headerY = topMargin / 2;
        if (!isEvenPage) { // Odd pages (right side)
            doc.text(ebookData.author, pageWidth - outerMargin, headerY, { align: 'right' });
        } else { // Even pages (left side)
            doc.text(displayTitle, outerMargin, headerY, { align: 'left' });
        }
    } else { // Front matter pages
        // Only number the table of contents pages.
        if (i >= tocPageNumber && i < finalChapter1StartPage) { 
             pageNumStr = toRoman(i).toLowerCase();
        }
    }

    if (pageNumStr) {
        doc.setFontSize(10);
        const footerY = pageHeight - (bottomMargin / 2);
        
        if (i >= finalChapter1StartPage) { // Main content pages get outer numbering
            if (isEvenPage) {
                doc.text(pageNumStr, outerMargin, footerY, { align: 'left' });
            } else {
                doc.text(pageNumStr, pageWidth - outerMargin, footerY, { align: 'right' });
            }
        } else { // Front matter pages get centered numbering
             doc.text(pageNumStr, pageWidth / 2, footerY, { align: 'center' });
        }
    }
  }

  const filename = ebookData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`${filename}_manuscript.pdf`);
};
