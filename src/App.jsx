import { useState, useCallback, useEffect } from "react";
import "./App.css";
import TypingArea from "./components/TypingArea";
import ProgressBar from "./components/ProgressBar";
import Keyboard from "./components/Keyboard";
import Share from "./components/Share";
import Stats from "./components/Stats";
import Footer from "./components/Footer";
import ActionPrompt from "./components/ActionPrompt";
import codeSnippets from "./code_snippets.json";



// Create a shuffled deck of code snippets ensuring the first two are from different beginner languages
// I put this outside the component to avoid re-creating the deck on every render
const createShuffledDeck = () => {
    function shuffleArray(array) { // Shoutout to Ronald Fisher and Frank Yates for the Fisher-Yates shuffle
        for (let i = array.length - 1; i >= 1; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    const beginnerLangs = ["javascript", "cpp", "python", "typescript"];
    const beginnerDeck = [];
    const otherDeck = [];
    for(let i = 0; i < codeSnippets.length; i++) {
        for(let j = 0; j < codeSnippets[i].snippets.length; j++) {
            const snippet = { language: codeSnippets[i].language, code: codeSnippets[i].snippets[j] };
            if(beginnerLangs.includes(codeSnippets[i].language)) {
                beginnerDeck.push(snippet);
            }else {
                otherDeck.push(snippet);
            }
        }
    }
    shuffleArray(beginnerDeck);
    shuffleArray(otherDeck);

    const firstSnippet = beginnerDeck.pop();
    const secondSnippetIndex = beginnerDeck.findIndex(snippet => snippet.language != firstSnippet.language);
    let secondSnippet;
    if(secondSnippetIndex !== -1) {
        secondSnippet = beginnerDeck.splice(secondSnippetIndex, 1)[0];
    } else {
        secondSnippet = beginnerDeck.pop();
    }
    const remainingDeck = [...beginnerDeck, ...otherDeck];
    shuffleArray(remainingDeck);
    return [firstSnippet, secondSnippet, ...remainingDeck];
}




function App() {
    const [deck, setDeck] = useState(createShuffledDeck);
    const [snippetIndex, setSnippetIndex] = useState(0);
    const snippet = deck[snippetIndex];

    const [attempt, setAttempt] = useState(0);

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

    // Event listeners for R and Tab when snippet ends
    useEffect(() => {
        const handleKeyPress = (event) => {
            // Prevent default behavior (like navigating using Tab)
            event.preventDefault();

            if (event.key === 'r') {
                setAttempt(prev => prev + 1); // Change attempt so TypingArea key prop changes and remounts
                setProgress(0); // Progress and stats to initial state
                setStats({
                    wpm: 0,
                    accuracy: 100,
                    grossWpm: 0,
                    netWpm: 0,
                    elapsedMs: 0,
                    correct: 0,
                    typed: 0,
                    finished: false,
                });
            } else if (event.key === 'Tab') {
                setSnippetIndex(prev => prev + 1); // Setting snippetIndex will cause a render which will cause the snippet to change; and TypingArea will remount because its key prop changes
                setProgress(0); // Progress and stats to initial state
                setStats({
                    wpm: 0,
                    accuracy: 100,
                    grossWpm: 0,
                    netWpm: 0,
                    elapsedMs: 0,
                    correct: 0,
                    typed: 0,
                    finished: false,
                });
            }
        }

        if(stats.finished) {
            console.log('añadiendo addeventlistener');
            document.addEventListener('keydown', handleKeyPress);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        }
    }, [stats.finished]);


    const [progress, setProgress] = useState(0);
    const handleShare = useCallback(() => {
        console.log("Share button clicked", stats.wpm);
    }, [stats]);


    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center">
            <main className="flex-grow flex flex-col items-center justify-center w-full">
                <h1 className="text-4xl font-bold mb-4 font-mono">nerdracer</h1>

                <TypingArea
                    key={`${snippet.code}-${attempt}`}
                    codeToType={snippet.code}
                    language={snippet.language}
                    onProgressChange={setProgress}
                    onStatsChange={setStats}
                    onComplete={() => {
                        setStats((prev) => ({ ...prev, finished: true }));
                    }}
                />

                <ProgressBar progress={progress} />

                <div className="flex flex-row items-center justify-center w-full">
                    {stats.finished && <ActionPrompt text="Press R to repeat" className="mr-8" />}
                    <Stats
                        wpm={Math.round(stats.wpm)}
                        accuracy={Math.round(stats.accuracy)}
                    />
                    {stats.finished && <ActionPrompt text="Press Tab for next" className="ml-8" />}
                </div>

                <div style={{ height: "44px" }}>
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
