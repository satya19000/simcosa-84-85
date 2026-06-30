import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AuthGuard } from '@/components/auth/AuthGuard'
import Home from '@/pages/Home'
import Chat from '@/pages/Chat'
import Calendar from '@/pages/Calendar'
import Tasks from '@/pages/Tasks'
import Contacts from '@/pages/Contacts'
import Vault from '@/pages/Vault'
import Profile from '@/pages/Profile'
import Login from '@/pages/auth/Login'
import Signup from '@/pages/auth/Signup'
import PluginDebug from '@/pages/PluginDebug'
import WorkflowEditor from '@/pages/WorkflowEditor'
import AgentDashboard from '@/pages/AgentDashboard'
import MemoryGraphDashboard from '@/pages/MemoryGraphDashboard'
import Documents from '@/pages/Documents'
import DocumentSearch from '@/pages/DocumentSearch'
import DocumentDevDashboard from '@/pages/devtools/DocumentDevDashboard'
import CommunicationDashboard from '@/pages/devtools/CommunicationDashboard'
import HealthDashboard from '@/pages/devtools/HealthDashboard'
import FinanceDashboard from '@/pages/devtools/FinanceDashboard'
import ApprovalDashboard from '@/pages/devtools/ApprovalDashboard'
import MissionControlDashboard from '@/pages/devtools/MissionControlDashboard'
import Organization from '@/pages/Organization'
import Workspace from '@/pages/Workspace'
import SecurityDashboard from '@/pages/devtools/SecurityDashboard'
import Marketplace from '@/pages/Marketplace'
import SkillDetail from '@/pages/SkillDetail'
import MarketplaceDashboard from '@/pages/devtools/MarketplaceDashboard'
import AIGatewayDashboard from '@/pages/devtools/AIGatewayDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          element={
            <AuthGuard>
              <AppShell />
            </AuthGuard>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/devtools/plugins" element={<PluginDebug />} />
          <Route path="/devtools/workflows" element={<WorkflowEditor />} />
          <Route path="/devtools/agents" element={<AgentDashboard />} />
          <Route path="/devtools/memory" element={<MemoryGraphDashboard />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/search" element={<DocumentSearch />} />
          <Route path="/devtools/documents" element={<DocumentDevDashboard />} />
          <Route path="/devtools/communication" element={<CommunicationDashboard />} />
          <Route path="/devtools/health" element={<HealthDashboard />} />
          <Route path="/devtools/finance" element={<FinanceDashboard />} />
          <Route path="/devtools/approvals" element={<ApprovalDashboard />} />
          <Route path="/devtools/mission-control" element={<MissionControlDashboard />} />
          <Route path="/devtools/security" element={<SecurityDashboard />} />
          <Route path="/organization" element={<Organization />} />
          <Route path="/organization/:organizationId" element={<Organization />} />
          <Route path="/organization/:organizationId/workspace/:workspaceId" element={<Workspace />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/:skillId" element={<SkillDetail />} />
          <Route path="/devtools/marketplace" element={<MarketplaceDashboard />} />
          <Route path="/devtools/ai-gateway" element={<AIGatewayDashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
