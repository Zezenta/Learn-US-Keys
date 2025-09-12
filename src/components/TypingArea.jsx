import React from "react";

const TypingArea = () => {
    return (
        <textarea
            className="w-full h-48 bg-gray-800 text-white p-4 rounded-md shadow-md resize-none"
            placeholder="Start typing here..."
        />
    );
};

export default TypingArea;
