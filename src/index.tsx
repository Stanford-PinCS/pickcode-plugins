import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import "./App.css";
import { PluginLoader } from "./PluginLoader";
import { Sandbox } from "./Sandbox/Sandbox";

const App = () => {
    const base = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "") + "/";
    return (
        <BrowserRouter  basename={base}>
            <Routes>
                <Route path="/embed/:pluginName" element={<PluginLoader />} />
                <Route path="/sandbox/:pluginName" element={<Sandbox />} />
            </Routes>
        </BrowserRouter>
    );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
