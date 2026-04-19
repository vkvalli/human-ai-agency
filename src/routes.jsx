import { createBrowserRouter, Navigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import HomePage from "../pages/HomePage";
import InsightsPage from "../pages/InsightsPage";
import ImprovementPage from "../pages/ImprovementPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: "home", element: <HomePage /> },
      { path: "insights", element: <InsightsPage /> },
      { path: "improvement", element: <ImprovementPage /> },
    ],
  },
]);