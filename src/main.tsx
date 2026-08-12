import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { captureAttributionFromUrl } from "@/lib/attribution";

captureAttributionFromUrl();
createRoot(document.getElementById("root")!).render(<App />);
