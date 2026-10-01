import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.tsx";
import { partnerRegistrationRepository } from "./data/partnerRegistrationRepository";
import { partnerSessionStore } from "./features/eo/partnerSessionStore";
import "./index.css";
import "./styles/redesign.css";
import "./styles/redesign-depth.css";
import "./styles/field-journal.css";
import "./styles/field-workspace.css";
import "./styles/partner-studio.css";

const appRoot = createRoot(document.getElementById("root")!);
appRoot.render(<p role="status">Memuat JedaIn...</p>);
partnerRegistrationRepository
  .restoreSession()
  .catch(() => partnerSessionStore.logout())
  .finally(() =>
    appRoot.render(
      <StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StrictMode>,
    ),
  );
