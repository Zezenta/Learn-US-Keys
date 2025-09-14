const Key = ({ label, shiftedLabel, size = 1 }) => {
    const unitCols = 4;
    const isSymbolKey = label.length === 1;

    // Base classes for all keys
    const baseClasses =
        "relative rounded-md bg-gray-900 text-gray-200 font-mono border border-gray-400 shadow-md hover:bg-gray-300 transition-all min-w-0";

    // Classes for wordy keys like 'Enter', 'Shift'
    const wordKeyClasses =
        "flex items-center justify-center whitespace-nowrap px-2";

    return (
        <div
            className={`${baseClasses} ${!isSymbolKey ? wordKeyClasses : ""}`}
            style={{
                gridColumn: `span ${size * unitCols}`,
            }}
        >
            {isSymbolKey ? (
                // Layout for single-character keys (e.g., 'A', '1', ';')
                <>
                    {shiftedLabel && (
                        <span
                            className="absolute top-1 left-2 font-sans"
                            style={{ fontSize: "2cqi" }}
                        >
                            {shiftedLabel}
                        </span>
                    )}
                    <span
                        className="absolute bottom-1 right-2"
                        style={{ fontSize: "2.2cqi" }}
                    >
                        {label}
                    </span>
                </>
            ) : (
                // Layout for word keys (e.g., 'Caps Lock', 'Enter')
                <span style={{ fontSize: "1.8cqi" }}>{label}</span>
            )}
        </div>
    );
};

export default Key;
