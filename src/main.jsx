import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

if (process.env.NODE_ENV === "development") {
    import("react-scan").then(({ scan }) => {
        scan({
            log: true, // ver renders en la consola
            paint: true, // resaltar visualmente los renders
        });
    });
}

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <App />
    </StrictMode>
);
