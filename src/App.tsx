
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./index.css";
import Dashboard from "./pages/Dashboard";
import Buildings from "./pages/Buildings";
import Suppliers from "./pages/Suppliers";
import AssistenciasDashboard from "./pages/AssistenciasDashboard";
import ConfiguracaoServicos from "./pages/ConfiguracaoServicos";
import NotFound from "./pages/NotFound";

// Supplier public pages
import AcceptRequest from "./pages/supplier/AcceptRequest";
import ScheduleRequest from "./pages/supplier/ScheduleRequest";
import CompleteRequest from "./pages/supplier/CompleteRequest";
import Confirmation from "./pages/supplier/Confirmation";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Dashboard />,
  },
  {
    path: "/assistencias",
    element: <AssistenciasDashboard />,
  },
  {
    path: "/buildings",
    element: <Buildings />,
  },
  {
    path: "/suppliers",
    element: <Suppliers />,
  },
  {
    path: "/configuracao-servicos",
    element: <ConfiguracaoServicos />,
  },
  // Supplier public routes
  {
    path: "/supplier/accept",
    element: <AcceptRequest />,
  },
  {
    path: "/supplier/schedule",
    element: <ScheduleRequest />,
  },
  {
    path: "/supplier/complete",
    element: <CompleteRequest />,
  },
  {
    path: "/supplier/confirmation",
    element: <Confirmation />,
  },
  // Catch-all route for 404 pages
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
