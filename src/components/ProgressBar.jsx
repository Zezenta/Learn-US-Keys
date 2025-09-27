import React from 'react';

function ProgressBar({ progress }) {
    const clampedProgress = Math.min(100, Math.max(0, progress));

    return (
        <div className="w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
                className="bg-green-500 h-2.5 rounded-full origin-left transition-transform duration-150 ease-linear"
                style={{ transform: `scaleX(${clampedProgress / 100})` }}
            ></div>
        </div>
    );
}

export default React.memo(ProgressBar);