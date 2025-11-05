import React from 'react';

const Loader: React.FC = () => (
    <div className="flex justify-center items-center p-4">
        <div className="w-8 h-8 border-4 border-gray-700 border-t-green-400 rounded-full animate-spin"></div>
    </div>
);

export default Loader;