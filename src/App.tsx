import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { isConfigured } from './lib/supabase'
import { SessionProvider, useSession } from './lib/session'
import { Welcome } from './screens/Welcome'
import { CreateFamily } from './screens/CreateFamily'
import { JoinFamily } from './screens/JoinFamily'
import { Home } from './screens/Home'
import { Loading, LoadError, SetupMissing } from './screens/Status'

function AppRoutes() {
  const { status, retry } = useSession()
  if (status === 'loading') return <Loading />
  if (status === 'error') return <LoadError onRetry={retry} />

  if (status === 'noFamily') {
    return (
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/neu" element={<CreateFamily />} />
        <Route path="/beitreten" element={<JoinFamily />} />
        <Route path="/j/:code" element={<JoinFamily />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {/* Direkt nach dem Gründen: Einladung öffnen */}
      <Route path="/neu" element={<Navigate to="/?einladen=1" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  if (!isConfigured) return <SetupMissing />
  return (
    <BrowserRouter>
      <SessionProvider>
        <AppRoutes />
      </SessionProvider>
    </BrowserRouter>
  )
}
