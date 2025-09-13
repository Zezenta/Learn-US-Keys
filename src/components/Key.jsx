const Key = ({ label, shiftedLabel, size = 1 }) => {
    const unitCols = 4;
    const isSymbolKey = label.length === 1;

    // Base classes for all keys
    const baseClasses =
        "relative rounded-md bg-gray-200 text-gray-800 font-mono border border-gray-400 shadow-md hover:bg-gray-300 transition-all min-w-0";

    // Classes for wordy keys like 'Enter', 'Shift'
    const wordKeyClasses =
        "flex items-center justify-center text-sm whitespace-nowrap px-2";

    return (
        <div
            className={`${baseClasses} ${!isSymbolKey ? wordKeyClasses : ""}`}
            style={{
                gridColumn: `span ${size * unitCols}`,
                gridAutoRows: "52px",
            }}
            title={typeof label === "string" ? label : undefined}
        >
            {isSymbolKey ? (
                // Layout for single-character keys (e.g., 'A', '1', ';')
                <>
                    {shiftedLabel && (
                        <span className="absolute top-1 left-2 text-xs font-sans">
                            {shiftedLabel}
                        </span>
                    )}
                    <span className="absolute bottom-1 right-2 text-lg">
                        {label}
                    </span>
                </>
            ) : (
                // Layout for word keys (e.g., 'Caps Lock', 'Enter')
                <span>{label}</span>
            )}
        </div>
    );
};

export default Key;
