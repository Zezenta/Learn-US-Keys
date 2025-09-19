import React, {
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const MemoSyntax = React.memo(SyntaxHighlighter);

function CodeTyperReveal({
    codeToType,
    language = "javascript",
    height = 320, // visible height in px (type-racer style)
    padding = 16, // px
    fontSize = 18, // px
    lineHeight = 28, // px (1.55 aprox)
    tabSize = 2,
}) {
    const scrollRef = useRef(null);
    const baseWrapRef = useRef(null); // wraps the base <pre>
    const overlayClipRef = useRef(null); // wrapper we apply the clip-path to
    const measureRef = useRef(null);
    const textareaRef = useRef(null);

    const [value, setValue] = useState("");
    const [charW, setCharW] = useState(8); // monospace character width
    const [contentSize, setContentSize] = useState({ w: 0, h: 0 });

    // Precompute line start indices for fast lookup (O(n lines))
    const lines = useMemo(() => codeToType.split("\n"), [codeToType]);
    const lineStarts = useMemo(() => {
        const arr = [0];
        let acc = 0;
        for (let i = 0; i < lines.length - 1; i++) {
            acc += lines[i].length + 1; // +1 for \n
            arr.push(acc);
        }
        return arr; // arr[i] = starting index of line i
    }, [lines]);

    // Measure character width using the same font/size/line-height
    useLayoutEffect(() => {
        if (!measureRef.current) return;
        const span = measureRef.current;
        const rect = span.getBoundingClientRect();
        // There are 100 "0" characters
        const w = rect.width / 100;
        if (w > 0) setCharW(w);
    }, [fontSize, lineHeight]);

    // Measure content size (scrollWidth/scrollHeight) of the base block
    const measureContentSize = () => {
        const wrap = baseWrapRef.current;
        if (!wrap) return;
        const pre = wrap.querySelector("pre");
        if (!pre) return;
        const w = pre.scrollWidth;
        const h = pre.scrollHeight;
        setContentSize({ w, h });
    };

    useLayoutEffect(() => {
        measureContentSize();
    }, [codeToType, language, fontSize, lineHeight, padding, tabSize]);

    useEffect(() => {
        const onResize = () => measureContentSize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // Clamp to target length (optional)
    const typedLen = Math.min(value.length, codeToType.length);

    // Compute visual row/column (with tab expansion)
    const { row, col } = useMemo(() => {
        // find the current line by typedLen
        // line i starts at lineStarts[i] and ends at nextStart or end
        let r = 0;
        for (let i = 0; i < lineStarts.length; i++) {
            const start = lineStarts[i];
            const end =
                i + 1 < lineStarts.length
                    ? lineStarts[i + 1] - 1
                    : codeToType.length;
            if (typedLen >= start && typedLen <= end) {
                r = i;
                break;
            }
            if (typedLen > end) r = i + 1;
        }
        const lineStart = lineStarts[r] ?? 0;
        const inLine = codeToType.slice(lineStart, typedLen);
        let c = 0;
        for (let k = 0; k < inLine.length; k++) {
            const ch = inLine[k];
            if (ch === "\t") {
                const toNextTab = tabSize - (c % tabSize);
                c += toNextTab;
            } else {
                c += 1;
            }
        }
        return { row: r, col: c };
    }, [typedLen, lineStarts, codeToType, tabSize]);

    // Build an L-shaped clip-path for the dimmed overlay layer
    // Visible area: everything that has NOT been typed yet.
    const clipPath = useMemo(() => {
        const w = contentSize.w || 1;
        const h = contentSize.h || 1;
        const x = padding + col * charW;
        const yTop = padding + row * lineHeight;
        const yBot = yTop + lineHeight;

        // Clamp values to avoid invalid numbers
        const X = Math.max(0, Math.min(x, w));
        const YT = Math.max(0, Math.min(yTop, h));
        const YB = Math.max(0, Math.min(yBot, h));

        // L-shaped polygon:
        // 1) from the caret to the right on its line
        // 2) and from below that line to the end, full width
        // polygon(
        //   X YT, w YT, w h, 0 h, 0 YB, X YB
        // )
        const pts = [
            `${X}px ${YT}px`,
            `${w}px ${YT}px`,
            `${w}px ${h}px`,
            `0px ${h}px`,
            `0px ${YB}px`,
            `${X}px ${YB}px`,
        ].join(", ");
        return `polygon(${pts})`;
    }, [contentSize.w, contentSize.h, padding, col, charW, row, lineHeight]);

    // Keep caret visible inside the container by adjusting scroll
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const w = el.clientWidth;
        const h = el.clientHeight;

        const caretX = padding + col * charW;
        const yTop = padding + row * lineHeight;
        const yBot = yTop + lineHeight;

        // Horizontal
        if (caretX < el.scrollLeft + 8) {
            el.scrollLeft = Math.max(0, caretX - 8);
        } else if (caretX > el.scrollLeft + w - 24) {
            el.scrollLeft = caretX - w + 24;
        }
        // Vertical
        if (yTop < el.scrollTop + 8) {
            el.scrollTop = Math.max(0, yTop - 8);
        } else if (yBot > el.scrollTop + h - 8) {
            el.scrollTop = yBot - h + 8;
        }
    }, [col, row, charW, lineHeight, padding, value]);

    // Shared styles for pre and textarea
    const fontFamily =
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
    const editorBg = "#1E1E1E"; // theme background
    const codeTagProps = {
        style: {
            fontFamily,
            fontSize: `${fontSize}px`,
            lineHeight: `${lineHeight}px`,
            whiteSpace: "pre", // NO wrap
            tabSize,
            MozTabSize: tabSize,
        },
    };
    const preBaseStyle = {
        margin: 0,
        background: editorBg,
        padding: `${padding}px`,
    };
    const preOverlayStyle = {
        margin: 0,
        background: "transparent",
        padding: `${padding}px`,
        // Applies only to overlay text:
        // makes them black, and opacity controls
        // how "placeholder"-like they appear (0.7 ≈ 30% brightness).
        opacity: 0.4,
        filter: "brightness(0)",
    };

    return (
        <div className="w-full flex justify-center">
            <div
                className="relative w-full border border-gray-700 rounded-md"
                style={{ maxWidth: 672 }} // ~42rem
            >
                {/* Scrollable container wrapping everything */}
                <div
                    ref={scrollRef}
                    className="relative overflow-auto rounded-md"
                    style={{ height, background: editorBg }}
                >
                    {/* BASE layer (100% opacity, with background) */}
                    <div
                        ref={baseWrapRef}
                        style={{ position: "relative", zIndex: 0 }}
                    >
                        <MemoSyntax
                            language={language}
                            style={vscDarkPlus}
                            customStyle={preBaseStyle}
                            codeTagProps={codeTagProps}
                            wrapLongLines={false}
                            showLineNumbers={false}
                        >
                            {codeToType}
                        </MemoSyntax>
                    </div>

                    {/* DIMMED OVERLAY layer (text only, same DOM, transparent background) */}
                    <div
                        ref={overlayClipRef}
                        className="pointer-events-none absolute top-0 left-0"
                        style={{
                            width: contentSize.w || "100%",
                            height: contentSize.h || "100%",
                            clipPath,
                            zIndex: 2,
                            willChange: "clip-path",
                        }}
                    >
                        <MemoSyntax
                            language={language}
                            style={vscDarkPlus}
                            customStyle={preOverlayStyle}
                            codeTagProps={codeTagProps}
                            wrapLongLines={false}
                            showLineNumbers={false}
                        >
                            {codeToType}
                        </MemoSyntax>
                    </div>

                    {/* Invisible textarea to capture typing and show the caret */}
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        spellCheck="false"
                        autoCapitalize="none"
                        autoComplete="off"
                        autoCorrect="off"
                        className="absolute top-0 left-0 w-full h-full focus:outline-none"
                        style={{
                            background: "transparent",
                            color: "transparent",
                            caretColor: "#60a5fa",
                            fontFamily,
                            fontSize: `${fontSize}px`,
                            lineHeight: `${lineHeight}px`,
                            tabSize,
                            MozTabSize: tabSize,
                            padding: `${padding}px`,
                            whiteSpace: "pre",
                            resize: "none",
                            overflow: "hidden",
                            zIndex: 3,
                        }}
                    />
                </div>

                {/* Hidden measurer for character width */}
                <span
                    ref={measureRef}
                    aria-hidden
                    style={{
                        position: "absolute",
                        left: -9999,
                        top: -9999,
                        whiteSpace: "pre",
                        fontFamily,
                        fontSize: `${fontSize}px`,
                        lineHeight: `${lineHeight}px`,
                    }}
                >
                    {Array.from({ length: 100 }).fill("0").join("")}
                </span>
            </div>
        </div>
    );
}

export default CodeTyperReveal;
