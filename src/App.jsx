import CodeBlock from "./components/CodeBlock";
import TypingArea from "./components/TypingArea";
import Keyboard from "./components/Keyboard";

function App() {
    const code = `function helloWorld() {
  console.log("Hello, world!");
}`;

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold mb-8">Learn US Keys</h1>
            <CodeBlock code={code} />
            <TypingArea />
            <Keyboard />
        </div>
    );
}

export default App;
