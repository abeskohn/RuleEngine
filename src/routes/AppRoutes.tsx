// src/routes/AppRoutes.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import ColumnManagement from "../pages/ColumnManagement";
import RuleManagement from "../pages/RuleManagement";
import RuleApply from "../pages/RuleApply";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ColumnManagement />} />
      <Route path="/rules" element={<RuleManagement />} />
      <Route path="/rule-apply" element={<RuleApply />} />
    </Routes>
  );
}

export default AppRoutes;
