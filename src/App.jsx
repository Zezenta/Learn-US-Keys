import TypingArea from "./components/TypingArea";
import Keyboard from "./components/Keyboard";
import codeSnippets from "./code_snippets.json";

function App() {
    const snippet = codeSnippets[0]; // Select the first snippet object

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold mb-8">Learn US Keys</h1>
            <TypingArea codeToType={snippet.code} language={snippet.language} />
            <Keyboard />
        </div>
    );
}

export default App;
