function Stats({ wpm, accuracy }) {
    return (
        <div className="mt-4 text-center">
            <div className="text-2xl font-mono">
                WPM: <span className="font-bold">{wpm}</span>
            </div>
            <div className="text-2xl font-mono">
                Accuracy: <span className="font-bold">{accuracy}%</span>
            </div>
        </div>
    );
}

export default Stats;
