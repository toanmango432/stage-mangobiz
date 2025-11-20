import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { App } from "./App";
import { HeaderColorPreview } from "./components/HeaderColorPreview";
import { TicketColorPreview } from "./components/TicketColorPreview";

export function AppRouter() {
  return <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/preview/headers" element={<HeaderColorPreview />} />
            <Route path="/preview/tickets" element={<TicketColorPreview />} />
          </Routes>
      </BrowserRouter>;
}