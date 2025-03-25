import { Route, Routes, useLocation } from "react-router-dom";
import Footer from "./Components/Footer";
import Nav from "./Components/Nav";
import AboutPage from "./Pages/AboutPage";
import ContactPage from "./Pages/ContactPage";
import IndexPage from "./Pages/IndexPage";
import ServicePage from "./Pages/ServicePage";
import Login from "./Pages/LoginPage";
import Signup from "./Pages/SignupPage";
import ProfilePage from "./Pages/ProfilePage";
import ProjectsPage from "./Pages/ProjectsPage";
import MessagesPage from "./Pages/MessagesPage";
import MessageDetailPage from "./Pages/MessageDetailPage";
import NotificationsPage from "./Pages/NotificationsPage";
import NotificationDetailPage from "./Pages/NotificationDetailPage";

// Design Pages
import ClientRequestPage from "./Desgin pages/ClientRequestPage";
import ClientRequestsPage from "./Desgin pages/ClientRequestsPage";
import ClientDesignersPage from "./Desgin pages/ClientDesignersPage";
import DesignerRequestsPage from "./Desgin pages/DesignerRequestsPage";
import DesignerProposalsPage from "./Desgin pages/DesignerProposalsPage";
import DesignerPortfolioPage from "./Desgin pages/DesignerPortfolioPage";

function App() {
  const location = useLocation();
  const hideNavFooter =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/profile"||
    location.pathname === "/client-request";

  return (
    <>
      {!hideNavFooter && <Nav />}

      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/services" element={<ServicePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/messages/:id" element={<MessageDetailPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/notifications/:id" element={<NotificationDetailPage />} />

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
      </Routes>

      {!hideNavFooter && <Footer />}
    </>
  );
}

export default App;
