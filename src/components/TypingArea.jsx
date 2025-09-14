import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const TypingArea = ({ codeToType, language }) => {
    // this is a dumb comment, but I'm learning to use react so:
    // this is a react hook that creates a state variable using useState
    // userInput is the current value of the state
    // setUserInput is a function that updates the value of userInput so the HTML can re-render automatically
    const [userInput, setUserInput] = useState("");

    const sharedStyles = {
        width: "100%",
        maxWidth: "42rem", // max-w-4xl
        height: "12rem", // h-48
        padding: "1rem", // p-4
        fontFamily: "monospace",
        fontSize: "1.125rem", // text-lg
        lineHeight: "1.75rem", // Corresponds to text-lg line-height in Tailwind
        borderRadius: "0.375rem", // rounded-md
        border: "2px solid #4A5568", // border-2 border-gray-700
        backgroundColor: "transparent", // Explicitly set for customStyle
    };

    return (
        <div className="relative w-full max-w-4xl">
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
                className="!m-0 opacity-40"
            >
                {codeToType}
            </SyntaxHighlighter>

            <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                style={sharedStyles}
                className="absolute top-0 left-0 bg-transparent text-gray-100 caret-blue-500 focus:outline-none resize-none"
                spellCheck="false"
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
            />
        </div>
    );
};

export default TypingArea;
