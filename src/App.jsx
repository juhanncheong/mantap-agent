import { Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import Users from "./pages/Users";
import InvitationCodes from "./pages/InvitationCodes";
import AgentTrialBonus from "./pages/AgentTrialBonus";

function ProtectedRoute({ children }) {
  const token =
    localStorage.getItem("auth_token") ||
    localStorage.getItem("agent_token");

  return token ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AdminLogin />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        }
      />

      <Route
        path="/invitation-codes"
        element={
          <ProtectedRoute>
            <InvitationCodes />
          </ProtectedRoute>
        }
      />

      <Route
        path="/trial-bonus"
        element={
          <ProtectedRoute>
            <AgentTrialBonus />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}