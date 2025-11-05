
import React from 'react';
import type { GroundingChunk } from '../types';
import { sanitizeHtml } from '../services/security.ts';

interface GroundedResponseDisplayProps {
    content: string;
    citations: GroundingChunk[];
}

const GroundedResponseDisplay: React.FC<GroundedResponseDisplayProps> = ({ content, citations }) => {
    // A simple way to preserve basic formatting from the model's text response.
    const formattedContent = content.replace(/\n/g, '<br />');

    return (
        <div>
            <div
                className="prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(formattedContent) }}
            />
            {citations && citations.length > 0 && (
                <div className="mt-4 border-t border-gray-700 pt-3">
                    <h4 className="text-xs font-semibold text-gray-400 mb-2">Sources</h4>
                    <ul className="space-y-1">
                        {citations.map((chunk, index) => {
                            if (chunk.web) {
                                let displayTitle = chunk.web.title;
                                // Fallback to hostname if title is missing
                                if (!displayTitle) {
                                    try {
                                        displayTitle = new URL(chunk.web.uri).hostname.replace(/^www\./, '');
                                    } catch (e) {
                                        displayTitle = chunk.web.uri;
                                    }
                                }
                                return (
                                    <li key={index} className="text-xs flex items-baseline gap-1.5">
                                        <span className="text-gray-500 font-medium">{`[${index + 1}]`}</span>
                                        <a
                                            href={chunk.web.uri}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:underline break-all"
                                            title={chunk.web.uri}
                                        >
                                            {displayTitle}
                                        </a>
                                    </li>
                                );
                            }
                            return null;
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default GroundedResponseDisplay;