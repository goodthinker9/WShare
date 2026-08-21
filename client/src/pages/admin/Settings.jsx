import { useState } from 'react';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    siteName: 'WolloShare',
    itemsPerPage: '20',
    maintenanceMode: '0',
    enableNotifications: '1',
  });

  const handleSave = async (e) => {
    e.preventDefault();
    toast.success('Settings saved successfully!');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-500 mt-1">Configure platform-wide settings.</p>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">General</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Items Per Page</label>
                <input
                  type="number"
                  value={settings.itemsPerPage}
                  onChange={(e) => setSettings({...settings, itemsPerPage: e.target.value})}
                  className="input-field w-32"
                  min="5"
                  max="100"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode === '1'}
                  onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked ? '1' : '0'})}
                  className="h-4 w-4 text-primary-600 rounded border-gray-300"
                />
                <div>
                  <p className="text-sm font-medium text-gray-700">Maintenance Mode</p>
                  <p className="text-xs text-gray-500">When enabled, only admins can access the platform.</p>
                </div>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.enableNotifications === '1'}
                  onChange={(e) => setSettings({...settings, enableNotifications: e.target.checked ? '1' : '0'})}
                  className="h-4 w-4 text-primary-600 rounded border-gray-300"
                />
                <div>
                  <p className="text-sm font-medium text-gray-700">Enable Notifications</p>
                  <p className="text-xs text-gray-500">Send notifications to users for system events.</p>
                </div>
              </label>
            </div>
          </div>

          <button type="submit" className="btn-primary">Save Settings</button>
        </form>
      </div>
    </div>
  );
}

