import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Dashboard/Sidebar";
import Header from "../Dashboard/Header";

function DashboardPage() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-black"} flex`}>
      <Sidebar />
      <div className="flex-1 flex flex-col lg:pl-64">
        <Header />
        <main className="flex-1 overflow-auto">
          <Outlet context={{ onThemeChange: handleThemeChange }} />
        </main>
      </div>
    </div>
  );
}

export default DashboardPage;