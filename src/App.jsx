import React, { useState } from "react";
import "./App.css";
import TypingArea from "./components/TypingArea";
import Keyboard from "./components/Keyboard";
import Stats from "./components/Stats";
import codeSnippets from "./code_snippets.json";

function App() {
    const snippet = {
        code: codeSnippets[1].snippets[0],
        language: codeSnippets[1].language,
    };

    const [stats, setStats] = useState({
        wpm: 0,
        accuracy: 100,
        grossWpm: 0,
        netWpm: 0,
        elapsedMs: 0,
        correct: 0,
        typed: 0,
        finished: false,
    });

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold mb-4 font-mono">nerdracer</h1>

            <TypingArea
                key={snippet.code}
                codeToType={snippet.code}
                language={snippet.language}
                onStatsChange={setStats}
                onComplete={(finalStats) => {
                    // choose what to do when finished
                    console.log("Finished:", finalStats);
                }}
            />

            <Stats
                wpm={Math.round(stats.wpm)}
                accuracy={Math.round(stats.accuracy)}
            />
        </div>
    );
}

export default App;
