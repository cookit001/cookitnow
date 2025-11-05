import React from 'react';
import type { Tutorial } from '../types';

const WebIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m-9 9h18" />
    </svg>
);

const VerifiedIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm3.733 8.384a.75.75 0 001.06-1.06l-3.5-3.5a.75.75 0 00-1.06 0l-1.5 1.5a.75.75 0 101.06 1.06l.97-.97 3.03 3.03z" clipRule="evenodd" />
    </svg>
);


const TutorialsDisplay: React.FC<{ tutorials: Tutorial[] }> = ({ tutorials }) => {
    return (
        <div className="w-full bg-gray-800 p-6 rounded-lg text-gray-300">
            <h3 className="text-2xl font-bold text-white mb-4">Helpful Tutorials</h3>
            {tutorials.length === 0 ? (
                <p className="text-gray-500">No verified tutorials were found for this recipe. Try a more common dish for better results.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tutorials.map((tutorial, index) => (
                        <div key={index} className="border border-gray-700 rounded-lg flex flex-col justify-between bg-gray-900 hover:shadow-lg hover:shadow-gray-800/50 hover:-translate-y-1 transition-all">
                            <div className="p-4 flex-grow">
                                <div className="flex items-center gap-2.5 mb-2">
                                    <WebIcon />
                                    <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                                        {tutorial.source}
                                    </span>
                                </div>
                                <h4 className="font-semibold text-white leading-tight">{tutorial.title}</h4>
                                <p className="text-sm text-gray-400 mt-1 line-clamp-3">{tutorial.description}</p>
                            </div>
                            <div className="px-3 pb-3">
                                <div className="flex items-center justify-center gap-2 text-xs text-blue-300 mb-2">
                                    <VerifiedIcon />
                                    <span>Cook AI Verified Link</span>
                                </div>
                                <a
                                    href={tutorial.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full text-center block py-2 px-4 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-500 transition-colors"
                                >
                                    View Tutorial
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TutorialsDisplay;