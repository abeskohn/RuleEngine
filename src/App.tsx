// src/App.tsx
import React from "react";
import { Sidebar } from "./components/Sidebar";
import AppRoutes from "./routes/AppRoutes"; // New file for routing

function App() {
  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-4">
        <AppRoutes />
      </main>
    </div>
  );
}

export default App;
