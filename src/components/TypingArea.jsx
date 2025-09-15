import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const TypingArea = ({ codeToType, language }) => {
    const [userInput, setUserInput] = useState("");

    const sharedStyles = {
        width: "100%",
        maxWidth: "42rem",
        height: "12rem",
        padding: "1rem",
        fontFamily: "monospace",
        fontSize: "1.125rem",
        lineHeight: "1.75rem",
        borderRadius: "0.375rem",
        border: "2px solid #4A5568",
        backgroundColor: "transparent",
    };

    return (
        <div className="relative w-full max-w-4xl grid place-items-center">
            <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                customStyle={sharedStyles}
                codeTagProps={{
                    style: {
                        fontFamily: sharedStyles.fontFamily,
                        fontSize: sharedStyles.fontSize,
                    },
                }}
                className="!m-0 opacity-40 col-start-1 row-start-1 relative z-0"
            >
                {codeToType}
            </SyntaxHighlighter>

            <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                style={sharedStyles}
                className="bg-transparent text-gray-100 caret-blue-500 focus:outline-none resize-none col-start-1 row-start-1 relative z-10"
                spellCheck="false"
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
            />
        </div>
    );
};

export default TypingArea;
