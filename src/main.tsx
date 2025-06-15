
import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from "react-router-dom"
import App from './App'
import './index.css'

console.log("Debug: main.tsx loaded");

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

try {
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>
  )
  console.log("Debug: React app rendered successfully");
} catch (e) {
  console.error("Critical error rendering app:", e);
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = '<div style="color:red;font-size:1.2rem">Erro crítico ao carregar a aplicação. Veja a consola para mais detalhes.</div>';
  }
}
