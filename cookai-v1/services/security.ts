/**
 * Sanitizes an HTML string to prevent XSS attacks.
 * It removes script tags, on* event handlers, and javascript: hrefs.
 * For a production application, it is highly recommended to use a more robust,
 * well-tested library like DOMPurify. This is a basic implementation for demonstration.
 * @param htmlString The dirty HTML string.
 * @returns A sanitized HTML string.
 */
export const sanitizeHtml = (htmlString: string): string => {
    // Return empty string for any falsy input
    if (!htmlString) return '';

    try {
        // Use the browser's built-in parser for a more robust sanitization
        if (typeof window.DOMParser !== 'undefined') {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlString, 'text/html');

            // 1. Remove all <script> and <style> elements which can execute code or change layout
            doc.querySelectorAll('script, style, link, iframe, object, embed').forEach(el => el.remove());

            // 2. Remove all elements with on* attributes (e.g., onclick, onerror)
            // and other attributes that can execute scripts (e.g., srcdoc, formaction)
            const forbiddenAttrs = ['srcdoc', 'form', 'formaction'];
            doc.querySelectorAll('*').forEach(el => {
                for (const attr of [...el.attributes]) {
                    const attrName = attr.name.toLowerCase();
                    if (attrName.startsWith('on') || forbiddenAttrs.includes(attrName)) {
                        el.removeAttribute(attr.name);
                    }
                }
            });

            // 3. Process all anchor tags for safety
            doc.querySelectorAll('a').forEach(link => {
                const href = link.getAttribute('href');
                // Remove javascript: links which can execute scripts
                if (href && href.trim().toLowerCase().startsWith('javascript:')) {
                    link.setAttribute('href', '#');
                }
                // Add rel="noopener noreferrer" for security against tab-nabbing
                link.setAttribute('rel', 'noopener noreferrer');
                // Always add target="_blank" to external links for better UX
                link.setAttribute('target', '_blank');
            });

            return doc.body.innerHTML;
        }
    } catch (e) {
        console.error("HTML sanitization with DOMParser failed, falling back to basic regex.", e);
    }
    
    // Fallback for environments without DOMParser. This is less secure.
    let sanitized = htmlString.replace(/<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/ on\w+="[^"]*"/gi, '');
    sanitized = sanitized.replace(/ on\w+='[^']*'/gi, '');
    sanitized = sanitized.replace(/ href="javascript:[^"]*"/gi, ' href="#"');
    sanitized = sanitized.replace(/ href='javascript:[^']*'/gi, " href='#'");
    return sanitized;
};