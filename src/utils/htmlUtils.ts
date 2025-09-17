/**
 * Utility functions for handling HTML content from rich text editors
 */

/**
 * Cleans HTML content from ReactQuill by removing unwanted paragraph wrapping and nbsp characters
 * ReactQuill automatically wraps content in <p> tags and adds &nbsp; characters which can interfere
 * with custom HTML content like tables
 * 
 * @param html - The HTML string to clean
 * @returns The cleaned HTML string
 */
export const cleanReactQuillHtml = (html: string | null | undefined): string => {
  if (!html || typeof html !== 'string') return '';
  
  // Remove wrapping <p> tags and &nbsp; characters that ReactQuill adds
  let cleaned = html
    .replace(/^<p>&nbsp;/, '') // Remove opening <p>&nbsp;
    .replace(/<\/p>$/, '') // Remove closing </p>
    .replace(/<p>&nbsp;/g, '') // Remove <p>&nbsp; in the middle
    .replace(/<\/p>/g, '') // Remove all </p> tags
    .replace(/&nbsp;/g, '') // Remove all &nbsp; characters
    .trim();
  
  // Decode HTML entities that ReactQuill automatically encodes
  cleaned = cleaned
    .replace(/&lt;/g, '<') // Convert &lt; back to <
    .replace(/&gt;/g, '>') // Convert &gt; back to >
    .replace(/&amp;/g, '&') // Convert &amp; back to &
    .replace(/&quot;/g, '"') // Convert &quot; back to "
    .replace(/&#x27;/g, "'") // Convert &#x27; back to '
    .replace(/&#x2F;/g, '/'); // Convert &#x2F; back to /
  
  return cleaned;
};

/**
 * Prepares HTML content for ReactQuill editing by ensuring it has the proper structure
 * that ReactQuill expects. This is used when loading existing content for editing.
 * 
 * @param html - The HTML string to prepare for editing
 * @returns The HTML string ready for ReactQuill editing
 */
export const prepareHtmlForEditing = (html: string | null | undefined): string => {
  if (!html || typeof html !== 'string') return '<p><br></p>';
  
  const trimmed = html.trim();
  
  // If the content is empty or just whitespace, return empty paragraph
  if (trimmed === '') {
    return '<p><br></p>';
  }
  
  // For complex HTML content (tables, divs, etc.), wrap in a div container
  // This ensures ReactQuill can properly handle and edit the content
  if (trimmed.match(/^<(div|table|h[1-6]|ul|ol|blockquote|pre)/)) {
    return `<div>${trimmed}</div>`;
  }
  
  // Handle malformed <p> tags (incomplete opening tags)
  if (trimmed.startsWith('<p>') && !trimmed.endsWith('</p>')) {
    // Complete the malformed paragraph tag
    return trimmed + '</p>';
  }
  
  // If the content is already properly wrapped in <p> tags, return as is
  if (trimmed.startsWith('<p>') && trimmed.endsWith('</p>')) {
    return trimmed;
  }
  
  // For simple text content, wrap in paragraph tags
  return `<p>${trimmed}</p>`;
};
