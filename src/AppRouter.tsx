import { BrowserRouter, Routes, Route } from "react-router-dom";
import { App } from "./App";
import { HeaderColorPreview } from "./components/HeaderColorPreview";
import { TicketColorPreview } from "./components/TicketColorPreview";
import { FormTestPage } from "./pages/FormTestPage";

export function AppRouter() {
  return <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/preview/headers" element={<HeaderColorPreview />} />
            <Route path="/preview/tickets" element={<TicketColorPreview />} />
            <Route path="/test/forms" element={<FormTestPage />} />
          </Routes>
      </BrowserRouter>;
}