import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";

export default function Settings() {
  const { onThemeChange } = useOutletContext();
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    showAnalytics: true,
    emailUpdates: true,
    theme: "light",
    language: "en",
    timeFormat: "12-hour",
    defaultView: "recent",
    sidebarVisible: true,
    layout: "grid",
    fontSize: "medium",
    itemsPerPage: 10,
    defaultSorting: "date",
    filterPersistence: true,
    twoFactorAuth: false,
    sessionTimeout: "1h",
    profileVisibility: "public",
    googleIntegration: false,
    microsoftIntegration: false,
    slackIntegration: false,
    apiAccess: false,
    webhooks: false,
    experimentalFeatures: false,
  });

  useEffect(() => {
    onThemeChange(settings.theme);
  }, [settings.theme, onThemeChange]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSave = () => {
    alert("Settings saved!");
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Dashboard Settings</h2>

      {/* General Settings */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">General Settings</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Theme Selection</label>
          <select
            name="theme"
            value={settings.theme}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System Default</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Language Preference</label>
          <select
            name="language"
            value={settings.language}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            {/* Add more languages as needed */}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Date & Time Format</label>
          <select
            name="timeFormat"
            value={settings.timeFormat}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="12-hour">12-hour</option>
            <option value="24-hour">24-hour</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Notification Preferences</label>
          <label className="relative inline-block h-8 w-14 cursor-pointer rounded-full bg-gray-300 transition">
            <input
              type="checkbox"
              name="notifications"
              checked={settings.notifications}
              onChange={handleChange}
              className="peer sr-only"
            />
            <span className="absolute inset-y-0 start-0 m-1 size-6 rounded-full bg-gray-300 ring-[6px] ring-inset ring-white transition-all peer-checked:start-8 peer-checked:w-2 peer-checked:bg-blue-500 peer-checked:ring-transparent"></span>
          </label>
        </div>
      </div>

      {/* Data & Display Settings */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Data & Display Settings</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Items Per Page</label>
          <select
            name="itemsPerPage"
            value={settings.itemsPerPage}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Default Sorting</label>
          <select
            name="defaultSorting"
            value={settings.defaultSorting}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="date">Date</option>
            <option value="rating">Rating</option>
            <option value="name">Name</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Filter Persistence</label>
          <label className="relative inline-block h-8 w-14 cursor-pointer rounded-full bg-gray-300 transition">
            <input
              type="checkbox"
              name="filterPersistence"
              checked={settings.filterPersistence}
              onChange={handleChange}
              className="peer sr-only"
            />
            <span className="absolute inset-y-0 start-0 m-1 size-6 rounded-full bg-gray-300 ring-[6px] ring-inset ring-white transition-all peer-checked:start-8 peer-checked:w-2 peer-checked:bg-blue-500 peer-checked:ring-transparent"></span>
          </label>
        </div>
      </div>

      {/* Security & Privacy */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Security & Privacy</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Two-Factor Authentication (2FA)</label>
          <label className="relative inline-block h-8 w-14 cursor-pointer rounded-full bg-gray-300 transition">
            <input
              type="checkbox"
              name="twoFactorAuth"
              checked={settings.twoFactorAuth}
              onChange={handleChange}
              className="peer sr-only"
            />
            <span className="absolute inset-y-0 start-0 m-1 size-6 rounded-full bg-gray-300 ring-[6px] ring-inset ring-white transition-all peer-checked:start-8 peer-checked:w-2 peer-checked:bg-blue-500 peer-checked:ring-transparent"></span>
          </label>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Session Timeout Duration</label>
          <select
            name="sessionTimeout"
            value={settings.sessionTimeout}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="15m">15 minutes</option>
            <option value="1h">1 hour</option>
            <option value="8h">8 hours</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Profile Visibility</label>
          <select
            name="profileVisibility"
            value={settings.profileVisibility}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>

      {/* Integrations */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Integrations</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Google Integration</label>
          <label className="relative inline-block h-8 w-14 cursor-pointer rounded-full bg-gray-300 transition">
            <input
              type="checkbox"
              name="googleIntegration"
              checked={settings.googleIntegration}
              onChange={handleChange}
              className="peer sr-only"
            />
            <span className="absolute inset-y-0 start-0 m-1 size-6 rounded-full bg-gray-300 ring-[6px] ring-inset ring-white transition-all peer-checked:start-8 peer-checked:w-2 peer-checked:bg-blue-500 peer-checked:ring-transparent"></span>
          </label>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Microsoft Integration</label>
          <label className="relative inline-block h-8 w-14 cursor-pointer rounded-full bg-gray-300 transition">
            <input
              type="checkbox"
              name="microsoftIntegration"
              checked={settings.microsoftIntegration}
              onChange={handleChange}
              className="peer sr-only"
            />
            <span className="absolute inset-y-0 start-0 m-1 size-6 rounded-full bg-gray-300 ring-[6px] ring-inset ring-white transition-all peer-checked:start-8 peer-checked:w-2 peer-checked:bg-blue-500 peer-checked:ring-transparent"></span>
          </label>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Slack Integration</label>
          <label className="relative inline-block h-8 w-14 cursor-pointer rounded-full bg-gray-300 transition">
            <input
              type="checkbox"
              name="slackIntegration"
              checked={settings.slackIntegration}
              onChange={handleChange}
              className="peer sr-only"
            />
            <span className="absolute inset-y-0 start-0 m-1 size-6 rounded-full bg-gray-300 ring-[6px] ring-inset ring-white transition-all peer-checked:start-8 peer-checked:w-2 peer-checked:bg-blue-500 peer-checked:ring-transparent"></span>
          </label>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Advanced Settings</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Enable Experimental Features</label>
          <label className="relative inline-block h-8 w-14 cursor-pointer rounded-full bg-gray-300 transition">
            <input
              type="checkbox"
              name="experimentalFeatures"
              checked={settings.experimentalFeatures}
              onChange={handleChange}
              className="peer sr-only"
            />
            <span className="absolute inset-y-0 start-0 m-1 size-6 rounded-full bg-gray-300 ring-[6px] ring-inset ring-white transition-all peer-checked:start-8 peer-checked:w-2 peer-checked:bg-blue-500 peer-checked:ring-transparent"></span>
          </label>
        </div>
        <div className="mb-4">
          <button
            type="button"
            className="mt-4 bg-red-500 text-white py-2 px-4 rounded-md"
            onClick={() => setSettings({
              darkMode: false,
              notifications: true,
              showAnalytics: true,
              emailUpdates: true,
              theme: "light",
              language: "en",
              timeFormat: "12-hour",
              defaultView: "recent",
              sidebarVisible: true,
              layout: "grid",
              fontSize: "medium",
              itemsPerPage: 10,
              defaultSorting: "date",
              filterPersistence: true,
              twoFactorAuth: false,
              sessionTimeout: "1h",
              profileVisibility: "public",
              googleIntegration: false,
              microsoftIntegration: false,
              slackIntegration: false,
              apiAccess: false,
              webhooks: false,
              experimentalFeatures: false,
            })}
          >
            Reset to Default
          </button>
        </div>
      </div>

      <button
        type="button"
        className="mt-4 bg-primary-500 text-white py-2 px-4 rounded-md"
        onClick={handleSave}
      >
        Save Settings
      </button>
    </div>
  );
}