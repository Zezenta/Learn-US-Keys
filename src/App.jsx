import { useState, useCallback } from "react";
import "./App.css";
import TypingArea from "./components/TypingArea";
import ProgressBar from "./components/ProgressBar";
import Keyboard from "./components/Keyboard";
import Share from "./components/Share";
import Stats from "./components/Stats";
import Footer from "./components/Footer";
import codeSnippets from "./code_snippets.json";

function App() {
    const snippet = {
        code: codeSnippets[1].snippets[0],
        language: codeSnippets[1].language,
    };
    const [progress, setProgress] = useState(0);
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
    const handleShare = useCallback(() => {
        console.log("Share button clicked", stats.wpm);
    }, [stats]);


    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center">
            <main className="flex-grow flex flex-col items-center justify-center w-full">
                <h1 className="text-4xl font-bold mb-4 font-mono">nerdracer</h1>

                <TypingArea
                    key={snippet.code}
                    codeToType={snippet.code}
                    language={snippet.language}
                    onProgressChange={setProgress}
                    onStatsChange={setStats}
                    onComplete={() => {
                        setStats((prev) => ({ ...prev, finished: true }));
                    }}
                />

                <ProgressBar progress={progress} />

                <Stats
                    wpm={Math.round(stats.wpm)}
                    accuracy={Math.round(stats.accuracy)}
                />

                <div className="mt-4" style={{ height: "44px" }}>
                    {stats.finished && (<Share
                        showShare={stats.finished}
                        onClick={handleShare}
                    />)}
                </div>
                
            </main>

            <Footer />
        </div>
    );
}

export default App;
