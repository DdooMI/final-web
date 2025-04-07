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
import NotificationDetailPage from "./Pages/NotificationDetailPage";
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
    location.pathname === "/client-request";

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
        <Route path="/notifications/:id" element={<NotificationDetailPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/messages/:conversationId" element={<MessageDetailPage />} />

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

        <Route path="/payment" element={<PaymentPage />} />
      </Routes>

      {!hideNavFooter && <Footer />}
    </>
  );
}

export default App;
