import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { isConfigured } from './lib/supabase'
import { SessionProvider, useSession } from './lib/session'
import { Welcome } from './screens/Welcome'
import { CreateFamily } from './screens/CreateFamily'
import { JoinFamily } from './screens/JoinFamily'
import { Home } from './screens/Home'
import { History } from './screens/History'
import { Settings } from './screens/Settings'
import { Chat } from './screens/Chat'
import { DataProvider } from './lib/data'
import { Loading, LoadError, SetupMissing } from './screens/Status'

function AppRoutes() {
  const { status, retry, errorDetail } = useSession()
  if (status === 'loading') return <Loading />
  if (status === 'error' || status === 'offline') return <LoadError onRetry={retry} offline={status === 'offline'} detail={errorDetail} />

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
    <DataProvider>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/verlauf" element={<History />} />
      <Route path="/einstellungen" element={<Settings />} />
      <Route path="/chat" element={<Chat />} />
      {/* Direkt nach dem Gründen: Einladung öffnen */}
      <Route path="/neu" element={<Navigate to="/?einladen=1" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </DataProvider>
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
