import React, { useEffect, useMemo, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const MemoSyntax = React.memo(SyntaxHighlighter);

// --- Small Utils ---
const expandTabs = (s, size) => (s || "").replace(/\t/g, " ".repeat(size));
const rowColFromPrefixLen = (text, len) => {
    let r = 0;
    let c = 0;
    for (let i = 0; i < len; i++) {
        const ch = text[i];
        if (ch === "\n") {
            r += 1;
            c = 0;
        } else {
            c += 1;
        }
    }
    return { row: r, col: c };
};

// --- Static Configuration ---
const tabSize = 4;
const height = 320; // visible height
const padding = 16; // px
const fontSize = 18; // px
const lineHeight = 28; // px
const editorBg = "#1E1E1E";

// --- Static Styles & Style Helpers ---
const fontFamily =
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
const metrics = {
    fontFamily,
    fontSize: `${fontSize}px`,
    lineHeight: `${lineHeight}px`,
    tabSize,
    MozTabSize: tabSize,
    fontVariantLigatures: "none", // avoid width variations
};
const codeTagProps = {
    style: { ...metrics, whiteSpace: "pre" },
};
const preBaseStyle = {
    margin: 0,
    background: editorBg,
    padding: `${padding}px`,
};
const overlayTextPre = {
    margin: 0,
    background: "transparent",
    padding: `${padding}px`,
};
const overlayTextCode = {
    ...metrics,
    whiteSpace: "pre",
    color: "rgba(0, 0, 0, 0.45)", // dim "ghost" ink
};
const errorCharStyle = {
    color: "#fff",
    backgroundColor: "rgba(239, 68, 68, 0.9)", // red-500-ish
    borderRadius: 2,
};

function TypingArea({ codeToType, language = "javascript" }) {
    // --- Refs and State ---
    const textareaRef = useRef(null);
    const caretMarkerRef = useRef(null);
    const [value, setValue] = useState(""); // User input keeps literal tabs

    // --- Memoized Calculations ---
    const renderCode = useMemo(
        () => expandTabs(codeToType, tabSize),
        [codeToType]
    );
    const renderValue = useMemo(() => expandTabs(value, tabSize), [value]);

    // Checks where the first mismatch is (or -1 if all match)
    const firstMismatch = useMemo(() => {
        const a = renderValue;
        const b = renderCode;
        const n = Math.max(a.length, b.length);
        for (let i = 0; i < n; i++) {
            if (a[i] !== b[i]) return i;
        }
        return -1;
    }, [renderValue, renderCode]);

    const holeLen = useMemo(() => {
        if (firstMismatch >= 0) return firstMismatch;
        return Math.min(renderValue.length, renderCode.length);
    }, [firstMismatch, renderValue.length, renderCode.length]);

    const caretLen = renderValue.length;

    const { row: holeRow, col: holeCol } = useMemo(
        () => rowColFromPrefixLen(renderValue, holeLen),
        [renderValue, holeLen]
    );
    const { row: caretRow, col: caretCol } = useMemo(
        () => rowColFromPrefixLen(renderValue, caretLen),
        [renderValue, caretLen]
    );

    const errorContent = useMemo(() => {
        if (firstMismatch < 0) return null;

        const nodes = [];
        const prefix = renderValue.slice(0, firstMismatch); // invisible via color: transparent
        if (prefix) nodes.push(prefix);

        // From mismatch to user's caret (so it follows the caret)
        for (let i = firstMismatch; i < renderValue.length; i++) {
            const ch = renderValue[i];
            if (ch === "\n") {
                // Real newline so the overlay follows lines correctly
                nodes.push("\n");
            } else {
                nodes.push(
                    <span key={`e-${i}`} style={errorCharStyle}>
                        {ch}
                    </span>
                );
            }
        }
        return nodes;
    }, [firstMismatch, renderValue]);

    // --- Side Effects ---
    useEffect(() => {
        caretMarkerRef.current?.scrollIntoView({
            block: "nearest",
            inline: "nearest",
        });
    }, [caretRow, caretCol, value]);

    // --- Event Handlers ---
    const onKeyDown = (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const ta = e.currentTarget;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const next = value.slice(0, start) + "\t" + value.slice(end);
            setValue(next);
            // Place caret after the inserted tab
            requestAnimationFrame(() => {
                const pos = start + 1;
                ta.selectionStart = ta.selectionEnd = pos;
            });
        }
    };

    // --- Dynamic Styles & Coordinates ---
    const xHole = `calc(${padding}px + ${holeCol}ch)`;
    const yHoleTop = `${padding + holeRow * lineHeight}px`;
    const yHoleBot = `${padding + (holeRow + 1) * lineHeight}px`;

    const xCaret = `calc(${padding}px + ${caretCol}ch)`;
    const yCaretTop = `${padding + caretRow * lineHeight}px`;

    // L-shaped clip that keeps "untyped" region dimmed
    const clipPath = `polygon(
    ${xHole} ${yHoleTop},
    100% ${yHoleTop},
    100% 100%,
    0 100%,
    0 ${yHoleBot},
    ${xHole} ${yHoleBot}
  )`;

    return (
        <div className="w-full flex justify-center">
            <div
                className="relative w-full border border-gray-700 rounded-md"
                style={{ maxWidth: 672 }}
            >
                {/* Scrollable container */}
                <div
                    className="relative overflow-auto rounded-md"
                    style={{ height, background: editorBg }}
                    onMouseDown={() => textareaRef.current?.focus()}
                >
                    {/* Content wrapper sized to code width (pre uses padding) */}
                    <div
                        className="relative"
                        style={{
                            display: "inline-block",
                            width: "max-content",
                        }}
                    >
                        {/* Base layer: vivid, syntax-highlighted code (single highlighter) */}
                        <MemoSyntax
                            language={language}
                            style={vscDarkPlus}
                            customStyle={preBaseStyle}
                            codeTagProps={codeTagProps}
                            wrapLongLines={false}
                            showLineNumbers={false}
                        >
                            {renderCode}
                        </MemoSyntax>

                        {/* Un-typed dim overlay (ghost text) clipped with L hole */}
                        <div
                            className="pointer-events-none absolute inset-0"
                            style={{
                                ...metrics,
                                clipPath,
                                willChange: "clip-path",
                                zIndex: 1,
                            }}
                            aria-hidden
                        >
                            <pre style={overlayTextPre}>
                                <code style={overlayTextCode}>
                                    {renderCode}
                                </code>
                            </pre>
                        </div>

                        {/* Error overlay: from first mismatch to caret (cascade). 
               Prefix is invisible (color: transparent) to keep geometry. */}
                        <div
                            className="pointer-events-none absolute inset-0"
                            style={{
                                ...metrics,
                                whiteSpace: "pre",
                                zIndex: 2,
                            }}
                            aria-hidden
                        >
                            <pre style={overlayTextPre}>
                                <code
                                    style={{
                                        ...metrics,
                                        whiteSpace: "pre",
                                        color: "transparent", // hide matched prefix
                                    }}
                                >
                                    {errorContent}
                                </code>
                            </pre>
                        </div>

                        {/* Invisible caret marker used only for auto-scroll (follows real caret) */}
                        <div
                            ref={caretMarkerRef}
                            aria-hidden
                            style={{
                                position: "absolute",
                                ...metrics,
                                left: xCaret,
                                top: yCaretTop,
                                width: 1,
                                height: lineHeight,
                                scrollMargin: "8px 24px 8px 8px",
                                zIndex: 0,
                            }}
                        />
                    </div>

                    {/* Invisible textarea that shows the blinking caret and captures input */}
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={onKeyDown}
                        spellCheck="false"
                        autoCapitalize="none"
                        autoComplete="off"
                        autoCorrect="off"
                        className="absolute top-0 left-0 w-full h-full focus:outline-none"
                        style={{
                            background: "transparent",
                            color: "transparent", // hide typed text
                            caretColor: "#60a5fa", // keep native caret visible
                            whiteSpace: "pre",
                            resize: "none",
                            overflow: "hidden",
                            padding: `${padding}px`,
                            ...metrics, // caret aligns with the code thanks to same metrics
                            zIndex: 3,
                        }}
                        aria-label="Type to reveal the code"
                    />
                </div>
            </div>
        </div>
    );
}

export default TypingArea;