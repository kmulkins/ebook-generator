
import { Ebook, FontChoice } from '../types';

declare const JSZip: any;
declare const saveAs: any;

const dataUriToBlob = (dataURI: string): Blob => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
};

const createContainerXml = () => `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

const createStyleCss = (font: FontChoice) => {
    let fontFamily = 'sans-serif';
    if (font === 'Garamond' || font === 'Times New Roman') fontFamily = 'serif';
    if (font === 'Courier') fontFamily = 'monospace';
    
    return `body {
    font-family: ${fontFamily};
    line-height: 1.5;
}
h1, h2, h3 {
    text-align: center;
    line-height: 1.2;
}
.cover {
    text-align: center;
    padding-top: 5vh;
}
.cover img {
    max-width: 90%;
    height: auto;
}
.author {
    font-style: italic;
    text-align: center;
}
.dedication {
    font-style: italic;
    text-align: center;
    margin-top: 40vh;
}
.chapter-image {
    text-align: center;
    margin: 20px 0;
}
.chapter-image img {
    max-width: 80%;
    height: auto;
}
p {
    text-indent: 1em;
    margin-top: 0;
    margin-bottom: 1em;
}`;
};

const createNavXhtml = (ebookData: Ebook) => {
    const tocItems = ebookData.chapters.map((chapter, index) =>
        `<li><a href="text/chapter-${index + 1}.xhtml">${chapter.title}</a></li>`
    ).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
    <title>Table of Contents</title>
</head>
<body>
    <nav epub:type="toc">
        <h1>Table of Contents</h1>
        <ol>
            <li><a href="text/title-page.xhtml">Title Page</a></li>
            ${ebookData.dedication ? `<li><a href="text/dedication.xhtml">Dedication</a></li>` : ''}
            ${tocItems}
        </ol>
    </nav>
</body>
</html>`;
};


const createContentOpf = (ebookData: Ebook, chapterImageCount: number) => {
    const uuid = crypto.randomUUID();
    const modifiedDate = new Date().toISOString().split('.')[0] + 'Z';

    const manifestItems = [
        '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
        '<item id="css" href="css/style.css" media-type="text/css"/>',
        '<item id="title-page" href="text/title-page.xhtml" media-type="application/xhtml+xml"/>',
    ];
    
    if (ebookData.dedication) {
        manifestItems.push('<item id="dedication" href="text/dedication.xhtml" media-type="application/xhtml+xml"/>');
    }
    ebookData.chapters.forEach((_, index) => {
        manifestItems.push(`<item id="chapter-${index + 1}" href="text/chapter-${index + 1}.xhtml" media-type="application/xhtml+xml"/>`);
        if (index < chapterImageCount) {
             manifestItems.push(`<item id="img-chapter-${index + 1}" href="images/chapter-${index + 1}.jpeg" media-type="image/jpeg"/>`);
        }
    });

    const spineItems = [
        '<itemref idref="title-page"/>'
    ];
    if (ebookData.dedication) {
        spineItems.push('<itemref idref="dedication"/>');
    }
    ebookData.chapters.forEach((_, index) => {
        spineItems.push(`<itemref idref="chapter-${index + 1}"/>`);
    });


    return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:title>${ebookData.title}</dc:title>
        <dc:creator>${ebookData.author}</dc:creator>
        <dc:language>en</dc:language>
        <dc:identifier id="bookid">urn:uuid:${uuid}</dc:identifier>
        <meta property="dcterms:modified">${modifiedDate}</meta>
    </metadata>
    <manifest>
        ${manifestItems.join('\n        ')}
    </manifest>
    <spine>
        ${spineItems.join('\n        ')}
    </spine>
</package>`;
};


export const generateEpub = async (ebookData: Ebook, chapterImageUrls: (string | null)[]): Promise<void> => {
    const zip = new JSZip();

    zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
    zip.file("META-INF/container.xml", createContainerXml());

    const oebps = zip.folder("OEBPS");
    oebps.file("css/style.css", createStyleCss(ebookData.font));
    oebps.file("nav.xhtml", createNavXhtml(ebookData));
    
    const images = oebps.folder("images");
    const validChapterImages = chapterImageUrls.filter(url => url !== null) as string[];
    validChapterImages.forEach((url, index) => {
        images.file(`chapter-${index + 1}.jpeg`, dataUriToBlob(url));
    });

    const text = oebps.folder("text");
    
    // Title page
    text.file("title-page.xhtml", `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${ebookData.title}</title><link href="../css/style.css" rel="stylesheet" type="text/css"/></head>
<body><h1>${ebookData.title}</h1>${ebookData.subtitle ? `<h2>${ebookData.subtitle}</h2>` : ''}<p class="author">by ${ebookData.author}</p></body></html>`);

    // Dedication
    if (ebookData.dedication) {
        text.file("dedication.xhtml", `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Dedication</title><link href="../css/style.css" rel="stylesheet" type="text/css"/></head>
<body><p class="dedication">${ebookData.dedication}</p></body></html>`);
    }

    // Chapters
    ebookData.chapters.forEach((chapter, index) => {
        const hasImage = chapterImageUrls[index] !== null;
        const imageTag = hasImage ? `<div class="chapter-image"><img src="../images/chapter-${index + 1}.jpeg" alt="${chapter.illustrationPrompt}" /></div>` : '';
        const content = chapter.fullContent ? chapter.fullContent.split('\n').filter(p => p.trim() !== '').map(p => `<p>${p}</p>`).join('') : '';

        text.file(`chapter-${index + 1}.xhtml`, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${chapter.title}</title><link href="../css/style.css" rel="stylesheet" type="text/css"/></head>
<body><h3>Chapter ${index + 1}: ${chapter.title}</h3>${imageTag}${content}</body></html>`);
    });

    oebps.file("content.opf", createContentOpf(ebookData, validChapterImages.length));
    
    const content = await zip.generateAsync({
        type: "blob",
        mimeType: "application/epub+zip",
    });

    const filename = ebookData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    saveAs(content, `${filename}_manuscript.epub`);
};
