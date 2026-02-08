import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, AppStateProvider } from "@immersive-lang/ui/contexts";
import "@immersive-lang/ui/styles";
import App from "./App";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider>
            <BrowserRouter>
                <AppStateProvider>
                    <App />
                </AppStateProvider>
            </BrowserRouter>
        </ThemeProvider>
    </StrictMode>,
);
