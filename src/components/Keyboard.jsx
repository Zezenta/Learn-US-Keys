import Key from "./Key";

const Keyboard = () => {
    const keyboardLayout = [
        [
            { label: "`", shiftedLabel: "~" },
            { label: "1", shiftedLabel: "!" },
            { label: "2", shiftedLabel: "@" },
            { label: "3", shiftedLabel: "#" },
            { label: "4", shiftedLabel: "$" },
            { label: "5", shiftedLabel: "%" },
            { label: "6", shiftedLabel: "^" },
            { label: "7", shiftedLabel: "&" },
            { label: "8", shiftedLabel: "*" },
            { label: "9", shiftedLabel: "(" },
            { label: "0", shiftedLabel: ")" },
            { label: "-", shiftedLabel: "_" },
            { label: "=", shiftedLabel: "+" },
            { label: "Backspace", size: 2 },
        ],
        [
            { label: "Tab", size: 1.5 },
            { label: "Q" },
            { label: "W" },
            { label: "E" },
            { label: "R" },
            { label: "T" },
            { label: "Y" },
            { label: "U" },
            { label: "I" },
            { label: "O" },
            { label: "P" },
            { label: "[", shiftedLabel: "{" },
            { label: "]", shiftedLabel: "}" },
            { label: "\\", shiftedLabel: "|", size: 1.5 },
        ],
        [
            { label: "Caps Lock", size: 1.75 },
            { label: "A" },
            { label: "S" },
            { label: "D" },
            { label: "F" },
            { label: "G" },
            { label: "H" },
            { label: "J" },
            { label: "K" },
            { label: "L" },
            { label: ";", shiftedLabel: ":" },
            { label: "'", shiftedLabel: '"' },
            { label: "Enter", size: 2.25 },
        ],
        [
            { label: "Shift", size: 2.25 },
            { label: "Z" },
            { label: "X" },
            { label: "C" },
            { label: "V" },
            { label: "B" },
            { label: "N" },
            { label: "M" },
            { label: ",", shiftedLabel: "<" },
            { label: ".", shiftedLabel: ">" },
            { label: "/", shiftedLabel: "?" },
            { label: "Shift", size: 2.75 },
        ],
        [
            { label: "Ctrl", size: 1.25 },
            { label: "Win", size: 1.25 },
            { label: "Alt", size: 1.25 },
            { label: " ", size: 6.25 },
            { label: "Alt", size: 1.25 },
            { label: "Fn", size: 1.25 },
            { label: "Menu", size: 1.25 },
            { label: "Ctrl", size: 1.25 },
        ],
    ];

    return (
        <div
            className="bg-gray-800 p-2 sm:p-4 rounded-lg shadow-lg w-full max-w-3xl mx-auto m-2"
            style={{ containerType: "inline-size" }}
        >
            <div className="flex flex-col" style={{ gap: "0.5cqi" }}>
                {keyboardLayout.map((row, rowIndex) => (
                    <div
                        key={rowIndex}
                        className="grid"
                        style={{
                            gridTemplateColumns: "repeat(60, minmax(0, 1fr))",
                            gridAutoRows: "6.5cqi",
                            gap: "0.5cqi",
                        }}
                    >
                        {row.map((key, keyIndex) => (
                            <Key
                                key={keyIndex}
                                label={key.label}
                                shiftedLabel={key.shiftedLabel}
                                size={key.size}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Keyboard;
