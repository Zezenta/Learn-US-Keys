import React, { useEffect, useMemo, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const MemoSyntax = React.memo(SyntaxHighlighter);

// --- Small Utils ---
const expandTabs = (s, size) => (s || "").replace(/\t/g, " ".repeat(size)); // Replaces tabs with spaces
const rowColFromPrefixLen = (text, len) => {
    // Given a text and a prefix length, returns (row, col)
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
const tabSize = 4; // option to change later
const minHeight = "260px";
const maxHeight = "35vh";
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
};

function TypingArea({
    codeToType,
    language = "javascript",
    onProgressChange,
    onStatsChange,
    onComplete,
}) {
    // --- Refs and State ---
    const textareaRef = useRef(null);
    const caretMarkerRef = useRef(null);
    const scrollRef = useRef(null); // scrollable container
    const [value, setValue] = useState(""); // User input keeps literal tabs

    // timing refs
    const startedAtRef = useRef(null);
    const finishedAtRef = useRef(null);
    const [finished, setFinished] = useState(false);

    // Update progress bar
    const calculateAndUpdateProgress = (currentValue) => {
        let correctChars = 0;
        for(let i = 0; i < codeToType.length; i++) {
            if (currentValue[i] === codeToType[i]) {
                correctChars++;
            } else {
                break;
            }
        }
        const progressPercentage = (correctChars / codeToType.length) * 100;
        onProgressChange(progressPercentage);
    }

    // --- Memoized Calculations ---
    const renderCode = useMemo(
        () => expandTabs(codeToType, tabSize),
        [codeToType]
    );
    const renderValue = useMemo(() => expandTabs(value, tabSize), [value]);

    // Checks where the first mismatch is (or -1 if all match)
    // Returns the index of the first differing character
    const firstMismatch = useMemo(() => {
        for (
            let i = 0;
            i < Math.max(renderValue.length, renderCode.length);
            i++
        ) {
            if (renderValue[i] !== renderCode[i]) return i;
        }
        return -1;
    }, [renderValue, renderCode]);

    // Length of the correct prefix (up to first mismatch, or full length if all match)
    // Returns how many characters are correct from the start
    const correctPrefixLen = useMemo(() => {
        if (firstMismatch >= 0) return firstMismatch;
        return Math.min(renderValue.length, renderCode.length);
    }, [firstMismatch]);

    const caretLen = renderValue.length;

    // Coordinates of correct prefix end & caret (row, col)
    const { row: correctPrefixRow, col: correctPrefixCol } = useMemo(
        () => rowColFromPrefixLen(renderValue, correctPrefixLen),
        [renderValue, correctPrefixLen]
    );
    const { row: caretRow, col: caretCol } = useMemo(
        () => rowColFromPrefixLen(renderValue, caretLen),
        [renderValue, caretLen]
    );

    const errorContent = useMemo(() => {
        if (firstMismatch < 0) return null;
        const nodes = [];
        const prefix = renderValue.slice(0, firstMismatch);
        if (prefix) nodes.push(prefix);
        for (let i = firstMismatch; i < renderValue.length; i++) {
            const ch = renderValue[i];
            if (ch === "\n") {
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

    // --- Stats: ticker + refs (report every 1s) ---
    const tickerIdRef = useRef(null);
    const correctRef = useRef(0);
    const onStatsChangeRef = useRef(onStatsChange);
    const keyCountsRef = useRef([0, 0]); // accuracy accumulated [correctKeys, wrongKeys]

    // sync refs in each render (cheap and doesn't re render)
    onStatsChangeRef.current = onStatsChange;
    correctRef.current = correctPrefixLen;

    // Calculates accuracy based on accumulated keystrokes
    const computeAccuracyFromKeys = () => {
        const [correctKeys, wrongKeys] = keyCountsRef.current;
        const totalKeys = correctKeys + wrongKeys;
        return totalKeys > 0 ? (correctKeys / totalKeys) * 100 : 100;
    };

    // Start ticker
    const startTicker = () => {
        if (tickerIdRef.current != null) return; // already running
        if (!startedAtRef.current) return; // not started yet

        tickerIdRef.current = window.setInterval(() => {
            const elapsedMs = Math.max(
                performance.now() - startedAtRef.current,
                1
            );
            const minutes = elapsedMs / 60000;

            const correct = correctRef.current;

            const accuracy = computeAccuracyFromKeys();
            const netWpm = correct > 0 ? correct / 5 / minutes : 0;

            onStatsChangeRef.current?.({
                wpm: netWpm,
                accuracy,
                elapsedMs,
                correct,
                finished: false,
            });
        }, 1000);
    };

    // Stop ticker function and cleanup
    const stopTicker = () => {
        if (tickerIdRef.current != null) {
            clearInterval(tickerIdRef.current);
            tickerIdRef.current = null;
        }
    };
    useEffect(() => {
        return () => stopTicker();
    }, []);

    // --- Accuracy accumulation ---
    const accumulateKeypresses = (prevExpanded, nextExpanded) => {
        const prevLen = prevExpanded.length;
        const nextLen = nextExpanded.length;

        // Only count added characters. Deletions/edits do not count.
        if (nextLen > prevLen) {
            let [correct, wrong] = keyCountsRef.current;
            for (let i = prevLen; i < nextLen; i++) {
                const typedCh = nextExpanded[i];
                const targetCh = renderCode[i];
                if (typedCh === targetCh) correct += 1;
                else wrong += 1;
            }
            keyCountsRef.current = [correct, wrong];
        }
    };

    const checkCompletionAndFinish = (newValue) => {
        const newRenderValue = expandTabs(newValue, tabSize);

        // If completed the code
        if (renderCode.length > 0 && newRenderValue === renderCode) {
            const finishTime = performance.now();
            finishedAtRef.current = finishTime;
            setFinished(true);
            textareaRef.current?.blur();

            // Stop ticker and send final stats
            stopTicker();

            const elapsedMs = Math.max(finishTime - startedAtRef.current, 1);
            const minutes = elapsedMs / 60000;
            const typed = newRenderValue.length;
            const correct = typed; // we know all are correct if completed
            const grossWpm = typed > 0 ? typed / 5 / minutes : 0;
            const netWpm = grossWpm;

            // accuracy from accumulated keys
            const [correctKeys, wrongKeys] = keyCountsRef.current;
            const totalKeys = correctKeys + wrongKeys;
            const accuracy =
                totalKeys > 0 ? (correctKeys / totalKeys) * 100 : 100;

            const finalStats = {
                wpm: netWpm,
                accuracy,
                grossWpm,
                netWpm,
                elapsedMs,
                correct,
                typed,
                finished: true,
            };
            onStatsChange?.(finalStats);
            onComplete?.(finalStats);
        }
    };




    // Scroll caret into view on changes
    useEffect(() => {
        const sc = scrollRef.current;
        if (!sc) return;

        // Vertical centering: keep caret ~40% from top while typing.
        // Clamp so we don't overscroll near the end.
        const viewH = sc.clientHeight;
        const maxTop = Math.max(sc.scrollHeight - viewH, 0);
        const caretTopPx = padding + caretRow * lineHeight; // top of caret line in content coords
        const desiredTop = caretTopPx - viewH * 0.4;
        const nextTop = Math.max(0, Math.min(desiredTop, maxTop));

        // Smooth vertical scroll for better UX
        sc.scrollTo({ top: nextTop, behavior: "smooth" });

        // Horizontal: keep nearest visibility without jumping
        caretMarkerRef.current?.scrollIntoView({
            block: "nearest",
            inline: "nearest",
        });
    }, [caretRow, caretCol, value]);
    // Focus textarea on mount
    useEffect(() => {
        textareaRef.current.focus();
    }, [textareaRef]);



    // Handle text area changes
    const handleTextAreaChange = (e) => {
        const newValue = e.target.value;
        if (finished) return;

        calculateAndUpdateProgress(newValue);

        // First keystroke starts the timer
        if (!startedAtRef.current && newValue.length > 0) {
            startedAtRef.current = performance.now();
            startTicker();
        }

        // Accumulate keystrokes (comparing previous vs new expanded)
        // Value state keeps literal tabs, so we must expand both
        const prevExpanded = renderValue;
        const newExpanded = expandTabs(newValue, tabSize);
        accumulateKeypresses(prevExpanded, newExpanded);

        setValue(newValue);
        checkCompletionAndFinish(newValue);
    };

    // Special key handling (Tab, Enter, and smart outdent on '}')
    const onKeyDown = (e) => {
        if (finished) return;

        // Helper to start the timer if not started yet
        const ensureStarted = (nextStr) => {
            if (!startedAtRef.current && nextStr.length > 0) {
                startedAtRef.current = performance.now();
                startTicker();
            }
        };

        // 1) Insert a real tab character (atomic for Backspace)
        if (e.key === "Tab") {
            e.preventDefault();
            const ta = e.currentTarget;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const next = value.slice(0, start) + "\t" + value.slice(end);
            calculateAndUpdateProgress(next);

            ensureStarted(next);

            const prevExpanded = renderValue;
            const nextExpanded = expandTabs(next, tabSize);
            accumulateKeypresses(prevExpanded, nextExpanded);

            setValue(next);
            checkCompletionAndFinish(next);

            requestAnimationFrame(() => {
                const pos = start + 1;
                ta.selectionStart = ta.selectionEnd = pos;
            });
            return;
        }

        const getLineInfo = (pos) => {
            const lineStart = value.lastIndexOf("\n", pos - 1) + 1;
            const nextNl = value.indexOf("\n", pos);
            const lineEnd = nextNl === -1 ? value.length : nextNl;
            const before = value.slice(lineStart, pos);
            const after = value.slice(pos, lineEnd);
            const indent = (before.match(/^[\t ]*/) || [""])[0];
            const indentUnit = indent.includes("\t")
                ? "\t"
                : " ".repeat(tabSize);

            let k = before.length - 1;
            while (k >= 0 && (before[k] === " " || before[k] === "\t")) k--;
            const prevChar = k >= 0 ? before[k] : null;

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

        // 2) Smart Enter
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
                if (info.nextChar === "}") {
                    insertText =
                        "\n" +
                        info.indent +
                        info.indentUnit +
                        "\n" +
                        info.indent;
                    caretDelta =
                        1 + info.indent.length + info.indentUnit.length;
                } else {
                    insertText = "\n" + info.indent + info.indentUnit;
                    caretDelta = insertText.length;
                }
            }

            const newValue = baseBefore + insertText + baseAfter;
            calculateAndUpdateProgress(newValue);

            ensureStarted(newValue);

            const prevExpanded = renderValue;
            const nextExpanded = expandTabs(newValue, tabSize);
            accumulateKeypresses(prevExpanded, nextExpanded);

            setValue(newValue);
            checkCompletionAndFinish(newValue);

            requestAnimationFrame(() => {
                const pos = start + caretDelta;
                ta.selectionStart = ta.selectionEnd = pos;
            });
            return;
        }

        // 3) Smart outdent on '}'
        if (e.key === "}") {
            const ta = e.currentTarget;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            if (start !== end) return;

            const info = getLineInfo(start);
            const caretInIndent = start - info.lineStart <= info.indent.length;

            if (caretInIndent && info.indent.length > 0) {
                e.preventDefault();

                let newIndent = info.indent;
                if (newIndent.endsWith("\t")) {
                    newIndent = newIndent.slice(0, -1);
                } else if (newIndent.endsWith(" ".repeat(tabSize))) {
                    newIndent = newIndent.slice(0, -tabSize);
                } else {
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

                ensureStarted(updated);

                const prevExpanded = renderValue;
                const nextExpanded = expandTabs(updated, tabSize);
                accumulateKeypresses(prevExpanded, nextExpanded);

                setValue(updated);
                checkCompletionAndFinish(updated);

                requestAnimationFrame(() => {
                    const pos = beforeLine.length + newIndent.length + 1;
                    ta.selectionStart = ta.selectionEnd = pos;
                });
                return;
            }
            // Otherwise, let the browser insert '}' normally (onChange lo maneja)
        }
    };

    // --- Dynamic Styles & Coordinates ---
    const xCorrectPrefix = `calc(${padding}px + ${correctPrefixCol}ch)`;
    const yCorrectPrefixTop = `${padding + correctPrefixRow * lineHeight}px`;
    const yCorrectPrefixBot = `${
        padding + (correctPrefixRow + 1) * lineHeight
    }px`;

    const xCaret = `calc(${padding}px + ${caretCol}ch)`;
    const yCaretTop = `${padding + caretRow * lineHeight}px`;

    const clipPath = `polygon(
    ${xCorrectPrefix} ${yCorrectPrefixTop},
    100% ${yCorrectPrefixTop},
    100% 100%,
    0 100%,
    0 ${yCorrectPrefixBot},
    ${xCorrectPrefix} ${yCorrectPrefixBot}
  )`;

    return (
        <div className="w-full flex justify-center">
            <div className="relative w-full border border-gray-700 rounded-md max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
                <div
                    ref={scrollRef}
                    className="relative overflow-auto rounded-md"
                    style={{
                        minHeight,
                        maxHeight,
                        background: editorBg
                    }}
                    onMouseDown={() => textareaRef.current?.focus()}
                >
                    <div
                        className="relative"
                        style={{
                            display: "inline-block",
                            width: "max-content",
                            minWidth: "100%",
                        }}
                    >
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
                    </div>
                    {/* Ghost overlay (untyped) */}
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
                            <code style={overlayTextCode}>{renderCode}</code>
                        </pre>
                    </div>

                    {/* Error overlay */}
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
                                    color: "transparent",
                                }}
                            >
                                {errorContent}
                            </code>
                        </pre>
                    </div>

                    {/* Caret marker for autoscroll */}
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

                    {/* Invisible textarea */}
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={handleTextAreaChange}
                        onKeyDown={onKeyDown}
                        spellCheck="false"
                        autoCapitalize="none"
                        autoComplete="off"
                        autoCorrect="off"
                        className="absolute top-0 left-0 w-full h-full focus:outline-none"
                        style={{
                            background: "transparent",
                            color: "transparent",
                            caretColor: "#60a5fa",
                            whiteSpace: "pre",
                            resize: "none",
                            overflow: "hidden",
                            padding: `${padding}px`,
                            ...metrics,
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
