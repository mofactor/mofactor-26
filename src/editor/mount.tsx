// Dev-only entry injected by the factorframe integration (src/integrations/factorframe.ts).
// Replaces DevEditorLoader.tsx (next/dynamic): the editor runs in its own React root,
// independent of the page's islands.
import { createRoot } from "react-dom/client";
import DevEditor from "./index";

const container = document.createElement("div");
container.setAttribute("data-factorframe", "");
document.body.appendChild(container);
createRoot(container).render(<DevEditor />);
