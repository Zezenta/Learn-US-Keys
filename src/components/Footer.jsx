import React from 'react';

function Footer() {
    return (
        <footer className="w-full p-4 m-2">
            <div className="flex justify-center items-center space-x-6 font-mono text-sm">
                <a
                    href="https://github.com/Zezenta"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-gray-300 transition-colors duration-200 underline"
                >
                    GitHub
                </a>
                <a
                    href="https://twitter.com/Zezenta0x128"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-gray-300 transition-colors duration-200 underline"
                >
                    X
                </a>
            </div>
        </footer>
    );
}

export default React.memo(Footer);