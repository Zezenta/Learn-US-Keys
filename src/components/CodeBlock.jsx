const CodeBlock = ({ code }) => {
    return (
        <div className="bg-gray-800 p-4 rounded-md shadow-md mb-8">
            <pre className="text-left whitespace-pre-wrap">
                <code>{code}</code>
            </pre>
        </div>
    );
};

export default CodeBlock;
