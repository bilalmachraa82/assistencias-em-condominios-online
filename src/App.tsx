
import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./index.css";
import Buildings from "./pages/Buildings";
import Assistencias from "./pages/Assistencias";
import ConfiguracaoServicos from "./pages/ConfiguracaoServicos";
import Dashboard from "./pages/Dashboard";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Dashboard />,
  },
  {
    path: "/buildings",
    element: <Buildings />,
  },
  {
    path: "/assistencias",
    element: <Assistencias />,
  },
  {
    path: "/configuracao-servicos",
    element: <ConfiguracaoServicos />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
