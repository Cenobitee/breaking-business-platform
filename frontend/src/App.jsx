import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppLayout } from './components/AppLayout'
import { InvestorDashboard } from './pages/InvestorDashboard'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { OperationsDashboard } from './pages/OperationsDashboard'
import { PlannedModulesPage } from './pages/PlannedModulesPage'
import { LiveDateTime } from './components/LiveDateTime'
import { BusinessProfilePage } from './pages/BusinessProfilePage'
import { LandingPage } from './pages/LandingPage'
import { ManagerReportsPage } from './pages/ManagerReportsPage'
import { TeamStructurePage } from './pages/TeamStructurePage'
import { SupportPage } from './pages/SupportPage'
import { EmployeeFormPage } from './pages/EmployeeFormPage'
import { ManagerAnalyticsPage } from './pages/ManagerAnalyticsPage'
import { PointOfSalePage } from './pages/PointOfSalePage'
import { OrderHistoryPage } from './pages/OrderHistoryPage'
import { ExpensesPage } from './pages/ExpensesPage'
import { UserProfilePage } from './pages/UserProfilePage'
import { MoneyJournalPage } from './pages/MoneyJournalPage'
import { BreakEvenPage } from './pages/BreakEvenPage'
import { BudgetCheckPage } from './pages/BudgetCheckPage'

export function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<ProtectedRoute roles={['OWNER', 'MANAGER', 'INVESTOR']} />}>
          <Route element={<AppLayout />}>
            <Route path="/business" element={<BusinessProfilePage />} />
            <Route path="/profile" element={<UserProfilePage />} />
            <Route element={<ProtectedRoute roles={['OWNER', 'MANAGER']} />}>
              <Route path="/operations" element={<OperationsDashboard />} />
              <Route path="/pos" element={<PointOfSalePage />} />
              <Route path="/orders" element={<OrderHistoryPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/accounting/journal" element={<MoneyJournalPage />} />
              <Route path="/accounting/break-even" element={<BreakEvenPage />} />
              <Route path="/accounting/budgets" element={<BudgetCheckPage />} />
              <Route path="/team" element={<TeamStructurePage />} />
              <Route path="/team/new" element={<EmployeeFormPage />} />
              <Route path="/team/:employeeId/edit" element={<EmployeeFormPage />} />
              <Route path="/support" element={<SupportPage />} />
            </Route>
            <Route element={<ProtectedRoute roles={['MANAGER']} />}>
              <Route path="/manager/analytics" element={<ManagerAnalyticsPage />} />
              <Route path="/manager/reports" element={<ManagerReportsPage />} />
            </Route>
            <Route element={<ProtectedRoute roles={['OWNER', 'INVESTOR']} />}>
              <Route path="/investor" element={<InvestorDashboard />} />
              <Route path="/investor/investments" element={<InvestorDashboard view="investments" />} />
              <Route path="/investor/history" element={<InvestorDashboard view="history" />} />
            </Route>
            <Route element={<ProtectedRoute roles={['OWNER']} />}>
              <Route path="/modules" element={<PlannedModulesPage />} />
              <Route path="/profile/:userId" element={<UserProfilePage />} />
            </Route>
          </Route>
        </Route>
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <LiveDateTime />
    </>
  )
}
