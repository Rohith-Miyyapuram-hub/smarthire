import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'

// QueryClient holds the cache for all server data fetched via TanStack Query.
// We create one instance at the top level and share it via the Provider.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,            // retry failed requests once before showing error
      staleTime: 1000 * 60, // cache results for 1 minute before refetching
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
