import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App.tsx";
import { SyncProvider } from "./context/SyncContext.tsx";
import { UserProvider } from "./context/UserContext.tsx";
import "./index.css";

// HashRouter : GitHub Pages ne sait pas renvoyer index.html pour /vins/123.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <UserProvider>
        <SyncProvider>
          <App />
        </SyncProvider>
      </UserProvider>
    </HashRouter>
  </StrictMode>
);
