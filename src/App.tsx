import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Business pages
import MentorList from './pages/mentors/MentorList';
import MentorForm from './pages/mentors/MentorForm';
import CaseList from './pages/cases/CaseList';
import CaseForm from './pages/cases/CaseForm';
import InsightList from './pages/insights/InsightList';
import InsightForm from './pages/insights/InsightForm';
import ServiceCategoryList from './pages/services/ServiceCategoryList';
import ServiceStageList from './pages/services/ServiceStageList';
import SiteStatList from './pages/siteStats/SiteStatList';
import CompanyList from './pages/companies/CompanyList';
import WhyUsList from './pages/whyUs/WhyUsList';
import TagList from './pages/tags/TagList';
import ContactList from './pages/contacts/ContactList';
import UserList from './pages/users/UserList';
import UserForm from './pages/users/UserForm';
import AuditLogList from './pages/audit/AuditLogList';

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1a365d',
          colorInfo: '#1a365d',
          colorSuccess: '#2f855a',
          colorWarning: '#c05621',
          colorError: '#c53030',
          borderRadius: 8,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
          fontSize: 14,
          colorBgContainer: '#ffffff',
          colorBgLayout: '#f7f8fa',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Dashboard />} />

                {/* Mentors */}
                <Route path="/mentors" element={<MentorList />} />
                <Route
                  path="/mentors/new"
                  element={
                    <ProtectedRoute requiredRole="operator">
                      <MentorForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/mentors/:id/edit"
                  element={
                    <ProtectedRoute requiredRole="operator">
                      <MentorForm />
                    </ProtectedRoute>
                  }
                />

                {/* Cases */}
                <Route path="/cases" element={<CaseList />} />
                <Route
                  path="/cases/new"
                  element={
                    <ProtectedRoute requiredRole="operator">
                      <CaseForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cases/:id/edit"
                  element={
                    <ProtectedRoute requiredRole="operator">
                      <CaseForm />
                    </ProtectedRoute>
                  }
                />

                {/* Insights */}
                <Route path="/insights" element={<InsightList />} />
                <Route
                  path="/insights/new"
                  element={
                    <ProtectedRoute requiredRole="operator">
                      <InsightForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/insights/:id/edit"
                  element={
                    <ProtectedRoute requiredRole="operator">
                      <InsightForm />
                    </ProtectedRoute>
                  }
                />

                {/* Services */}
                <Route path="/service-categories" element={<ServiceCategoryList />} />
                <Route path="/service-stages" element={<ServiceStageList />} />
                <Route path="/services" element={<Navigate to="/service-categories" replace />} />

                {/* Site Stats */}
                <Route path="/site-stats" element={<SiteStatList />} />

                {/* Companies */}
                <Route path="/companies" element={<CompanyList />} />

                {/* Why Us */}
                <Route path="/why-us" element={<WhyUsList />} />

                {/* Tags */}
                <Route path="/tags" element={<TagList />} />

                {/* Contacts */}
                <Route path="/contacts" element={<ContactList />} />

                {/* Audit Logs */}
                <Route
                  path="/audit-logs"
                  element={
                    <ProtectedRoute requiredRole="operator">
                      <AuditLogList />
                    </ProtectedRoute>
                  }
                />

                {/* Users (admin only) */}
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <UserList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users/new"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <UserForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users/:id/edit"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <UserForm />
                    </ProtectedRoute>
                  }
                />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}
