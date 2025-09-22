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
        // 1) Insert a real tab character (atomic for Backspace)
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
            return;
        }

        // Helper: compute line boundaries and indentation
        const getLineInfo = (pos) => {
            const lineStart = value.lastIndexOf("\n", pos - 1) + 1;
            const nextNl = value.indexOf("\n", pos);
            const lineEnd = nextNl === -1 ? value.length : nextNl;
            const before = value.slice(lineStart, pos);
            const after = value.slice(pos, lineEnd);
            const indent = (before.match(/^[\t ]*/) || [""])[0];

            // Determine the unit to use for one indent level
            // Prefer tabs if the line has tabs, otherwise spaces
            const indentUnit = indent.includes("\t")
                ? "\t"
                : " ".repeat(tabSize);

            // Last non-whitespace char before the caret within the line
            let k = before.length - 1;
            while (k >= 0 && (before[k] === " " || before[k] === "\t")) k--;
            const prevChar = k >= 0 ? before[k] : null;

            // First non-whitespace char after the caret within the line
            let m = 0;
            while (m < after.length && (after[m] === " " || after[m] === "\t"))
                m++;
            const nextChar = m < after.length ? after[m] : null;

            return {
                lineStart,
                lineEnd,
                before,
                after,
                indent,
                indentUnit,
                prevChar,
                nextChar,
            };
        };

        // 2) Smart Enter: keep indentation; if after '{' add one level;
        //    if the next non-ws is '}', do the common "brace split" layout.
        if (e.key === "Enter") {
            e.preventDefault();
            const ta = e.currentTarget;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const baseBefore = value.slice(0, start);
            const baseAfter = value.slice(end);

            const info = getLineInfo(start);
            let insertText = "\n" + info.indent;
            let caretDelta = insertText.length;

            if (info.prevChar === "{") {
                // Brace split if the closing brace is next (typical editor behavior)
                if (info.nextChar === "}") {
                    insertText =
                        "\n" +
                        info.indent +
                        info.indentUnit +
                        "\n" +
                        info.indent;
                    // Caret placed on the inner indented line
                    caretDelta =
                        1 + info.indent.length + info.indentUnit.length;
                } else {
                    insertText = "\n" + info.indent + info.indentUnit;
                    caretDelta = insertText.length;
                }
            }

            const newValue = baseBefore + insertText + baseAfter;
            setValue(newValue);
            requestAnimationFrame(() => {
                const pos = start + caretDelta;
                ta.selectionStart = ta.selectionEnd = pos;
            });
            return;
        }

        // 3) Smart outdent on '}' at the start indentation of the line:
        //    if caret is within the indentation, remove one indent level
        //    and then insert '}' at the new indentation column.
        if (e.key === "}") {
            const ta = e.currentTarget;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            if (start !== end) return; // let default handle selections

            const info = getLineInfo(start);
            const caretInIndent = start - info.lineStart <= info.indent.length;

            if (caretInIndent && info.indent.length > 0) {
                e.preventDefault();

                // Remove one indent level (tab or tabSize spaces)
                let newIndent = info.indent;
                if (newIndent.endsWith("\t")) {
                    newIndent = newIndent.slice(0, -1);
                } else if (newIndent.endsWith(" ".repeat(tabSize))) {
                    newIndent = newIndent.slice(0, -tabSize);
                } else {
                    // Fallback: remove up to tabSize trailing spaces
                    const m = newIndent.match(/ +$/);
                    if (m) {
                        const count = m[0].length;
                        const rm = Math.min(tabSize, count);
                        newIndent = newIndent.slice(0, newIndent.length - rm);
                    }
                }

                const beforeLine = value.slice(0, info.lineStart);
                const afterIndent = value.slice(
                    info.lineStart + info.indent.length
                );

                const updated = beforeLine + newIndent + "}" + afterIndent;
                setValue(updated);
                requestAnimationFrame(() => {
                    const pos = beforeLine.length + newIndent.length + 1; // after '}'
                    ta.selectionStart = ta.selectionEnd = pos;
                });
                return;
            }
            // Otherwise, let the browser insert '}' normally
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
            <div className="relative w-full border border-gray-700 rounded-md max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
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
