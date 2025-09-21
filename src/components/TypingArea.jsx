import React, { useEffect, useMemo, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const MemoSyntax = React.memo(SyntaxHighlighter);

function TypingArea({ codeToType, language = "javascript" }) {
    const textareaRef = useRef(null);
    const caretMarkerRef = useRef(null);

    // User input with literal tabs ('\t') — Backspace remains intuitive.
    const [value, setValue] = useState("");

    // Visual tab width in columns
    const tabSize = 4;

    // Render string: expand all tabs to spaces so Prism and the ghost overlay
    // see exactly the same glyph stream (no unexpected tab rendering).
    const renderCode = useMemo(() => {
        const spaces = " ".repeat(tabSize);
        return (codeToType || "").replace(/\t/g, spaces);
    }, [codeToType, tabSize]);

    // Compute caret row/col from the user's value (with tabs):
    // - newline resets col and increases row
    // - tab jumps to the next tab stop
    // - any other char advances 1 col
    const { row, col } = useMemo(() => {
        let r = 0;
        let c = 0;
        for (let i = 0; i < value.length; i++) {
            const ch = value[i];
            if (ch === "\n") {
                r += 1;
                c = 0;
            } else if (ch === "\t") {
                const mod = c % tabSize;
                const advance = mod === 0 ? tabSize : tabSize - mod;
                c += advance;
            } else {
                c += 1;
            }
        }
        return { row: r, col: c };
    }, [value, tabSize]);

    // Fixed editor dimensions and font metrics
    const height = 320; // visible height
    const padding = 16; // px
    const fontSize = 18; // px
    const lineHeight = 28; // px

    // Convert row/col into pixel coordinates
    // - x uses `ch` so it depends on the current font metrics
    // - y uses lineHeight and padding
    const x = `calc(${padding}px + ${col}ch)`; // from left edge to caret
    const yTop = `${padding + row * lineHeight}px`; // top of caret line
    const yBot = `${padding + (row + 1) * lineHeight}px`; // bottom of caret line

    // L-shaped clip that leaves "untyped" region covered by the overlay
    const clipPath = `polygon(
    ${x} ${yTop},
    100% ${yTop},
    100% 100%,
    0 100%,
    0 ${yBot},
    ${x} ${yBot}
  )`;

    // Keep the caret visible with a marker + scrollIntoView
    useEffect(() => {
        caretMarkerRef.current?.scrollIntoView({
            block: "nearest",
            inline: "nearest",
        });
    }, [row, col, value]);

    // Handle Tab as a single logical char: insert '\t' (not spaces).
    // Backspace will remove it as one key press — intuitive UX.
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

    // Shared font metrics: must be identical wherever we use `ch`
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

    const editorBg = "#1E1E1E";

    // Styles for the <code> inside <pre> in the base layer
    const codeTagProps = {
        style: {
            ...metrics,
            whiteSpace: "pre",
        },
    };

    const preBaseStyle = {
        margin: 0,
        background: editorBg,
        padding: `${padding}px`,
    };

    // Overlay text style (dark ghost text):
    // - It renders the same string, but as plain text (no highlighting)
    // - Black with alpha so it only darkens glyphs, not the background
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

                        {/* Text overlay (plain text, no highlighting).
               It paints semi-transparent black *only over glyph shapes*,
               so the background is not affected.
               We clip it with an L-shaped hole to reveal what has been typed. */}
                        <div
                            className="pointer-events-none absolute inset-0"
                            style={{
                                ...metrics,
                                clipPath,
                                willChange: "clip-path",
                            }}
                            aria-hidden
                        >
                            <pre style={overlayTextPre}>
                                <code style={overlayTextCode}>
                                    {renderCode}
                                </code>
                            </pre>
                        </div>

                        {/* Invisible caret marker used only for auto-scroll */}
                        <div
                            ref={caretMarkerRef}
                            aria-hidden
                            style={{
                                position: "absolute",
                                ...metrics,
                                left: x,
                                top: yTop,
                                width: 1,
                                height: lineHeight,
                                scrollMargin: "8px 24px 8px 8px",
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
                        }}
                        aria-label="Type to reveal the code"
                    />
                </div>
            </div>
        </div>
    );
}

export default TypingArea;
