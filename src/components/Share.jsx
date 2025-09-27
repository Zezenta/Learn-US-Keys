import React from "react";

function Share({ onClick }) {
    return (
        <button
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold font-mono py-2 px-4  rounded-md transition-colors duration-200 mt-4"
            style={{ paddingBottom: "0.35rem"}}
            onClick={onClick}
        >
            Share
        </button>
    );
}

export default React.memo(Share);
