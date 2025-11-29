import { useState } from 'react';
import {
  Store,
  MapPin,
  Clock,
  Phone,
  Mail,
  Building2,
  Check,
  Edit2,
  Plus,
  Globe,
  Settings
} from 'lucide-react';

interface StoreLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  timezone: string;
  isDefault: boolean;
  isActive: boolean;
}

export function StoreConfigurationPanel() {
  const [stores, setStores] = useState<StoreLocation[]>([
    {
      id: '1',
      name: 'Mango Nails & Spa - Downtown',
      address: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
      phone: '(415) 555-0100',
      email: 'downtown@mangonails.com',
      timezone: 'America/Los_Angeles',
      isDefault: true,
      isActive: true
    },
    {
      id: '2',
      name: 'Mango Nails & Spa - Marina',
      address: '456 Marina Blvd',
      city: 'San Francisco',
      state: 'CA',
      zip: '94123',
      phone: '(415) 555-0200',
      email: 'marina@mangonails.com',
      timezone: 'America/Los_Angeles',
      isDefault: false,
      isActive: true
    },
    {
      id: '3',
      name: 'Mango Nails & Spa - Union Square',
      address: '789 Powell Street',
      city: 'San Francisco',
      state: 'CA',
      zip: '94108',
      phone: '(415) 555-0300',
      email: 'unionsq@mangonails.com',
      timezone: 'America/Los_Angeles',
      isDefault: false,
      isActive: false
    }
  ]);

  const [selectedStore, setSelectedStore] = useState<string>('1');

  const handleSetDefault = (storeId: string) => {
    setStores(stores.map(store => ({
      ...store,
      isDefault: store.id === storeId
    })));
  };

  const handleToggleActive = (storeId: string) => {
    setStores(stores.map(store =>
      store.id === storeId ? { ...store, isActive: !store.isActive } : store
    ));
  };

  const defaultStore = stores.find(s => s.isDefault);
  const activeStores = stores.filter(s => s.isActive);

  return (
    <div className="space-y-6">
      {/* Default Store Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
            <Store className="w-6 h-6 text-blue-600" />
            Default Store
          </h2>
          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
            PRIMARY
          </span>
        </div>
        {defaultStore && (
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-3">{defaultStore.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-gray-700">{defaultStore.address}</div>
                  <div className="text-gray-500">
                    {defaultStore.city}, {defaultStore.state} {defaultStore.zip}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{defaultStore.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{defaultStore.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{defaultStore.timezone}</span>
              </div>
            </div>
          </div>
        )}
        <p className="text-xs text-blue-700 mt-3">
          This is your primary location. It will be used as the default for new appointments, tickets, and reports.
        </p>
      </div>

      {/* Store Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Building2 className="w-5 h-5 text-purple-600" />
            <span className="text-2xl font-bold text-gray-900">{stores.length}</span>
          </div>
          <div className="text-sm text-gray-600">Total Locations</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">{activeStores.length}</span>
          </div>
          <div className="text-sm text-gray-600">Active Stores</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">1</span>
          </div>
          <div className="text-sm text-gray-600">Time Zones</div>
        </div>
      </div>

      {/* All Locations */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-600" />
            All Locations
          </h3>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Location
          </button>
        </div>

        <div className="space-y-4">
          {stores.map((store) => (
            <div
              key={store.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                store.isDefault
                  ? 'border-blue-300 bg-blue-50'
                  : store.isActive
                  ? 'border-gray-200 bg-white hover:border-gray-300'
                  : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-gray-900">{store.name}</h4>
                    {store.isDefault && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded">
                        DEFAULT
                      </span>
                    )}
                    {!store.isActive && (
                      <span className="px-2 py-0.5 bg-gray-400 text-white text-xs font-semibold rounded">
                        INACTIVE
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        {store.address}, {store.city}, {store.state} {store.zip}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span>{store.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span>{store.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{store.timezone}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(store.id)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      store.isActive
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {store.isActive ? 'Active' : 'Inactive'}
                  </button>
                  {!store.isDefault && store.isActive && (
                    <button
                      onClick={() => handleSetDefault(store.id)}
                      className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                    >
                      Set Default
                    </button>
                  )}
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Store Preferences */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          Store Preferences
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Auto-Select Default Store</div>
              <div className="text-sm text-gray-600">Automatically select default store for new items</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Allow Store Selection at Checkout</div>
              <div className="text-sm text-gray-600">Let staff choose store during checkout process</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Cross-Store Data Sync</div>
              <div className="text-sm text-gray-600">Sync appointments and clients across all locations</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
