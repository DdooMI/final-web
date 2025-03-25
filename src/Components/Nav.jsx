import { useState, useRef, useEffect, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../zustand/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

// Constants for dropdown states
const INITIAL_DROPDOWN_STATE = {
  menu: false,
  messages: false,
  notifications: false
};



function Nav() {
  const { user, profile, logout, role } = useAuth();
  const navigate = useNavigate();

  const messagesRef = useRef(null);
  const notificationsRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const [dropdownState, setDropdownState] = useState(INITIAL_DROPDOWN_STATE);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", user.uid),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadNotifications(snapshot.docs.length);
    });

    return () => unsubscribe();
  },[user]);

  const closeAllDropdowns = useCallback(() => {
    setDropdownState(INITIAL_DROPDOWN_STATE);
  }, []);

  const toggleDropdown = useCallback((dropdownName) => {
    setDropdownState(prev => ({
      ...INITIAL_DROPDOWN_STATE,
      [dropdownName]: !prev[dropdownName]
    }));
  }, []);



  // Close dropdowns and mobile menu when clicking outside or pressing escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      const refs = {
        messages: messagesRef,
        notifications: notificationsRef,
        menu: mobileMenuRef
      };

      Object.entries(refs).forEach(([key, ref]) => {
        if (ref.current && !ref.current.contains(event.target)) {
          setDropdownState(prev => ({ ...prev, [key]: false }));
        }
      });
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeAllDropdowns();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [closeAllDropdowns]);
  return (
    <header>
      <nav className="fixed top-0 left-0 w-full bg-white backdrop-blur-lg shadow-md z-50">
        <div className="container mx-auto xl:px-6 px-6  py-4 flex justify-between items-center">
          {/* Logo */}
          <div className="text-3xl font-semibold font-playfair tracking-tighter logo mr-8">
            Harmony<span className="text-[#C19A6B] font-normal">Interiors</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden xl:flex items-center gap-x-4">

            <ul className="flex gap-x-3 text-[16px] font-medium tracking-tight">
              <li>
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    isActive
                      ? "text-[#C19A6B] relative py-2.5 px-4 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#C19A6B]"
                      : "relative py-2.5 px-4 text-gray-700 hover:text-[#C19A6B] transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#C19A6B] hover:after:w-full after:transition-all after:duration-300"
                  }
                >
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/about"
                  className={({ isActive }) =>
                    isActive
                      ? "text-[#C19A6B] relative py-2.5 px-4 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#C19A6B]"
                      : "relative py-2.5 px-4 text-gray-700 hover:text-[#C19A6B] transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#C19A6B] hover:after:w-full after:transition-all after:duration-300"
                  }
                >
                  About
                </NavLink>
              </li>
              <li >
                <NavLink
                  to="/services"
                  className={({ isActive }) =>
                    isActive
                      ? "text-[#C19A6B] relative py-2.5 px-4 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#C19A6B]"
                      : "relative py-2.5 px-4 text-gray-700 hover:text-[#C19A6B] transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#C19A6B] hover:after:w-full after:transition-all after:duration-300"
                  }
                >
                  Services
                </NavLink>
              </li>
              {role === "designer" && (
                <>
                  <li>
                    <NavLink
                      to="/designer-requests"
                      className={({ isActive }) =>
                        isActive
                          ? "text-[#C19A6B] relative py-2.5 px-4 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#C19A6B]"
                          : "relative py-2.5 px-4 text-gray-700 hover:text-[#C19A6B] transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#C19A6B] hover:after:w-full after:transition-all after:duration-300"
                      }
                    >
                      Requests
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/designer-proposals"
                      className={({ isActive }) =>
                        isActive
                          ? "text-[#C19A6B] relative py-2.5 px-4 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#C19A6B]"
                          : "relative py-2.5 px-4 text-gray-700 hover:text-[#C19A6B] transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#C19A6B] hover:after:w-full after:transition-all after:duration-300"
                      }
                    >
                      Proposals
                    </NavLink>
                  </li>
                </>
              )}
              {role === "client" && (
                <>
                  <li>
                    <NavLink
                      to="/client-requests"
                      className={({ isActive }) =>
                        isActive
                          ? "text-[#C19A6B] relative py-2.5 px-4 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#C19A6B]"
                          : "relative py-2.5 px-4 text-gray-700 hover:text-[#C19A6B] transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#C19A6B] hover:after:w-full after:transition-all after:duration-300"
                      }
                    >
                      My Requests
                    </NavLink>
                  </li>
                  
                  <li>
                    <NavLink
                      to="/client-designers"
                      className={({ isActive }) =>
                        isActive
                          ? "text-[#C19A6B] relative py-2.5 px-4 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#C19A6B]"
                          : "relative py-2.5 px-4 text-gray-700 hover:text-[#C19A6B] transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#C19A6B] hover:after:w-full after:transition-all after:duration-300"
                      }
                    >
                      Designers
                    </NavLink>
                  </li>
                </>
              )}
              <li>
                <NavLink
                  to="/contact"
                  className={({ isActive }) =>
                    isActive
                      ? "text-[#C19A6B] relative py-2.5 px-4 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#C19A6B]"
                      : "relative py-2.5 px-4 text-gray-700 hover:text-[#C19A6B] transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#C19A6B] hover:after:w-full after:transition-all after:duration-300"
                  }
                >
                  Contact
                </NavLink>
              </li>
            </ul>
            {user && (
              <div className="flex items-center gap-x-4">
                <NavLink to="/messages" className="relative p-2 text-gray-700 hover:text-[#C19A6B] transition-all duration-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-[#C19A6B] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">3</span>
                </NavLink>
                <NavLink to="/notifications" className="relative p-2 text-gray-700 hover:text-[#C19A6B] transition-all duration-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#C19A6B] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {unreadNotifications}
                    </span>
                  )}
                </NavLink>
                <NavLink to="/profile" className="flex items-center space-x-2 border-3 rounded-full border border-[#C19A6B]/20 hover:border-[#C19A6B] transition-all duration-300 shadow-sm">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <img src={profile?.photoURL || '/person.gif'} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                </NavLink>
              </div>
            )}
            {!user && (
              <div className="flex gap-x-4">
                <NavLink
                  to="/login"
                  className="px-6 py-2 text-[#C19A6B] border border-[#C19A6B] rounded-lg hover:bg-[#C19A6B] hover:text-white transition-all duration-300"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/signup"
                  className="px-6 py-2 text-white bg-[#C19A6B] border border-[#C19A6B] rounded-lg hover:bg-white/0 hover:text-[#C19A6B] transition-all duration-300"
                >
                  Sign up
                </NavLink>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="xl:hidden p-2 text-gray-700  hover:text-[#C19A6B] transition-all"
            onClick={() => toggleDropdown('menu')}
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Mobile Menu */}
          <div
            ref={mobileMenuRef}
            className={`xl:hidden fixed inset-0 bg-black/40 backdrop-blur-sm transform ${dropdownState.menu ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out z-50`}
          >
            <div className="absolute right-0 top-0 h-screen w-72 bg-white shadow-2xl transform transition-transform duration-300">
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  {user && (
                    <div
                      className="flex items-center space-x-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-all duration-300"
                      onClick={() => navigate('/profile')}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#C19A6B]/20 hover:border-[#C19A6B] transition-all duration-300 shadow-sm">
                        <img
                          src={profile?.photoURL || '/person.gif'}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {profile?.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate capitalize">{role}</p>
                      </div>
                    </div>
                  )}
                  <button
                    className="p-2 text-gray-500 hover:text-[#C19A6B] transition-all duration-300"
                    onClick={() => closeAllDropdowns()}
                    aria-label="Close menu"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <ul className="space-y-3 px-3">
                  <li>
                    <NavLink
                      to="/"
                      className={({ isActive }) =>
                        `flex items-center space-x-2 px-4 py-3 rounded-lg ${isActive ? 'text-[#C19A6B] bg-[#C19A6B]/10 font-medium' : 'text-gray-700 hover:text-[#C19A6B] hover:bg-[#C19A6B]/5'} transition-all duration-300`
                      }
                      onClick={closeAllDropdowns}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span>Home</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/about"
                      className={({ isActive }) =>
                        `flex items-center space-x-2 px-4 py-3 rounded-lg ${isActive ? 'text-[#C19A6B] bg-[#C19A6B]/10 font-medium' : 'text-gray-700 hover:text-[#C19A6B] hover:bg-[#C19A6B]/5'} transition-all duration-300`
                      }
                      onClick={closeAllDropdowns}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>About</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/services"
                      className={({ isActive }) =>
                        `flex items-center space-x-2 px-4 py-3 rounded-lg ${isActive ? 'text-[#C19A6B] bg-[#C19A6B]/10 font-medium' : 'text-gray-700 hover:text-[#C19A6B] hover:bg-[#C19A6B]/5'} transition-all duration-300`
                      }
                      onClick={closeAllDropdowns}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>Services</span>
                    </NavLink>
                  </li>{user && (
                    <> <li>
                      <NavLink
                        to="/notifications"
                        className={({ isActive }) =>
                          `flex items-center space-x-2 px-4 py-3 rounded-lg ${isActive ? 'text-[#C19A6B] bg-[#C19A6B]/10 font-medium' : 'text-gray-700 hover:text-[#C19A6B] hover:bg-[#C19A6B]/5'} transition-all duration-300`
                        }
                        onClick={closeAllDropdowns}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span>Notifications</span>
                      </NavLink>
                    </li> <li>
                        <NavLink
                          to="/messages"
                          className={({ isActive }) =>
                            `flex items-center space-x-2 px-4 py-3 rounded-lg ${isActive ? 'text-[#C19A6B] bg-[#C19A6B]/10 font-medium' : 'text-gray-700 hover:text-[#C19A6B] hover:bg-[#C19A6B]/5'} transition-all duration-300`
                          }
                          onClick={closeAllDropdowns}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>Messages</span>
                        </NavLink>
                      </li>
                    </>
                  )}
                  {role === 'designer' && (
                    <>
                      <li>
                        <NavLink
                          to="/designer-requests"
                          className={({ isActive }) =>
                            `flex items-center space-x-2 px-4 py-3 rounded-lg ${isActive ? 'text-[#C19A6B] bg-[#C19A6B]/10 font-medium' : 'text-gray-700 hover:text-[#C19A6B] hover:bg-[#C19A6B]/5'} transition-all duration-300`
                          }
                          onClick={closeAllDropdowns}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span>Requests</span>
                        </NavLink>
                      </li>
                      <li>
                        <NavLink
                          to="/designer-proposals"
                          className={({ isActive }) =>
                            `flex items-center space-x-2 px-4 py-3 rounded-lg ${isActive ? 'text-[#C19A6B] bg-[#C19A6B]/10 font-medium' : 'text-gray-700 hover:text-[#C19A6B] hover:bg-[#C19A6B]/5'} transition-all duration-300`
                          }
                          onClick={closeAllDropdowns}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Proposals</span>
                        </NavLink>
                      </li>
                    </>
                  )}{role === 'client' && (
                    <>
                      <li>
                        <NavLink
                          to="/client-requests"
                          className={({ isActive }) =>
                            `flex items-center space-x-2 px-4 py-3 rounded-lg ${isActive ? 'text-[#C19A6B] bg-[#C19A6B]/10 font-medium' : 'text-gray-700 hover:text-[#C19A6B] hover:bg-[#C19A6B]/5'} transition-all duration-300`
                          }
                          onClick={closeAllDropdowns}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span>My Requests</span>
                        </NavLink>
                      </li>
                      <li>
                        <NavLink
                          to="/client-designers"
                          className={({ isActive }) =>
                            `flex items-center space-x-2 px-4 py-3 rounded-lg ${isActive ? 'text-[#C19A6B] bg-[#C19A6B]/10 font-medium' : 'text-gray-700 hover:text-[#C19A6B] hover:bg-[#C19A6B]/5'} transition-all duration-300`
                          }
                          onClick={closeAllDropdowns}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Designers</span>
                        </NavLink>
                      </li>
                    </>
                  )}
                  <li>
                    <NavLink
                      to="/contact"
                      className={({ isActive }) =>
                        `flex items-center space-x-2 px-4 py-3 rounded-lg ${isActive ? 'text-[#C19A6B] bg-[#C19A6B]/10 font-medium' : 'text-gray-700 hover:text-[#C19A6B] hover:bg-[#C19A6B]/5'} transition-all duration-300`
                      }
                      onClick={closeAllDropdowns}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>Contact</span>
                    </NavLink>
                  </li>
                </ul>

                {user ? (
                  <div className="mt-auto px-3 py-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        logout(navigate);
                        closeAllDropdowns();
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-3 text-left text-gray-700 hover:text-white hover:bg-[#FF0000]/80 rounded-lg transition-all duration-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="mt-auto px-3 py-4 border-t border-gray-100 space-y-3">
                    <NavLink
                      to="/login"
                      className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 text-[#C19A6B] border border-[#C19A6B] rounded-lg hover:bg-[#C19A6B] hover:text-white transition-all duration-300"
                      onClick={closeAllDropdowns}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      <span>Login</span>
                    </NavLink>
                    <NavLink
                      to="/signup"
                      className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 text-white  border border-[#C19A6B] bg-[#C19A6B] rounded-lg hover:bg-white hover:text-[#C19A6B] transition-all duration-300"
                      onClick={closeAllDropdowns}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      <span>Sign up</span>
                    </NavLink>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Nav;

