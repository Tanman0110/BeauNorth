import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import faviconPng from "./assets/beau_north_logo_icon.png";

const favicon = document.querySelector("link[rel='icon']") || document.createElement("link");
favicon.rel = "icon";
favicon.type = "image/png";
favicon.href = faviconPng;
document.head.appendChild(favicon);

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);