import { Route, Routes, useLocation } from "react-router-dom";
import Footer from "./Components/Footer";
import Nav from "./Components/Nav";
import ScrollToTop from "./Components/ScrollToTop";
import AboutPage from "./Pages/AboutPage";
import ContactPage from "./Pages/ContactPage";
import IndexPage from "./Pages/IndexPage";
import ServicePage from "./Pages/ServicePage";
import Login from "./Pages/LoginPage";
import Signup from "./Pages/SignupPage";
import ForgotPasswordPage from "./Pages/ForgotPasswordPage";
import ProfilePage from "./Pages/ProfilePage";
import ProjectsPage from "./Pages/ProjectsPage";
import ProjectPage from "./Pages/ProjectPage";
import NotificationsPage from "./Pages/NotificationsPage";
import MessagesPage from "./Pages/MessagesPage";
import MessageDetailPage from "./Pages/MessageDetailPage";

// Design Pages
import ClientRequestPage from "./Desgin pages/ClientRequestPage";
import ClientRequestsPage from "./Desgin pages/ClientRequestsPage";
import ClientDesignersPage from "./Desgin pages/ClientDesignersPage";
import DesignerRequestsPage from "./Desgin pages/DesignerRequestsPage";
import DesignerProposalsPage from "./Desgin pages/DesignerProposalsPage";
import DesignerPortfolioPage from "./Desgin pages/DesignerPortfolioPage";
import PaymentPage from "./Pages/PaymentPage";
import DesignPreview from "./Components/DesignPreview";

// Dashboard
import DashboardPage from "./Pages/DashboardPage";
import { ProtectedRoute } from "./Components/ProtectedRoute";
import Dashboard from "./Dashboard/Dashboard";
import Settings from "./Dashboard/Settings";
import DesignerProfile from "./Dashboard/DesignerProfile";
import ClientProfile from "./Dashboard/ClientProfile";
import Analytics from "./Dashboard/Analytics";
import ClientsTable from "./Dashboard/ClientsTable";
import DesignersTable from "./Dashboard/DesignersTable";
import AdminProfile from "./Dashboard/AdminProfile";

function App() {
  const location = useLocation();
  const hideNavFooter =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/profile" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/projects" ||
    location.pathname === "/payment" ||
    location.pathname.startsWith("/project/") ||
    location.pathname.startsWith("/messages/") ||
    location.pathname.startsWith("/design-preview/") ||
    location.pathname.startsWith("/dashboard") ||
    location.pathname === "/client-request"

  return (
    <>
      <ScrollToTop />
      {!hideNavFooter && <Nav />}

      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/project/:proposalId" element={<ProjectPage />} />
        <Route path="/services" element={<ServicePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/messages/:conversationId" element={<MessageDetailPage />} />
        <Route path="/payment" element={<PaymentPage />} />

        {/* Design Routes */}
        <Route path="/client-request" element={<ClientRequestPage />} />
        <Route path="/client-requests" element={<ClientRequestsPage />} />
        <Route path="/client-designers" element={<ClientDesignersPage />} />
        <Route path="/designer-requests" element={<DesignerRequestsPage />} />
        <Route path="/designer-proposals" element={<DesignerProposalsPage />} />
        <Route
          path="/designer-portfolio/:designerId"
          element={<DesignerPortfolioPage />}
        />
        <Route
          path="/design-preview/:proposalId"
          element={<DesignPreview />}
        />

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="designer/:id" element={<DesignerProfile />} />
          <Route path="client/:id" element={<ClientProfile />} />
          <Route path="team" element={
            <div className="p-6 bg-white m-6 rounded-lg shadow-sm">
              <h1 className="text-2xl font-semibold text-gray-900 mb-6">Team</h1>
              <p className="text-gray-600">Team content will appear here.</p>
            </div>
          } />
          <Route path="settings" element={<Settings />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="clients" element={<ClientsTable />} />
          <Route path="designers" element={<DesignersTable />} />
          <Route path="admin-profile" element={<AdminProfile />} />
        </Route>

      </Routes>

      {!hideNavFooter && <Footer />}
    </>
  );
}

export default App;
