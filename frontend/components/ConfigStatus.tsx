'use client';

export function ConfigStatus() {
  const useAuthEmulator = process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === 'true';
  const useFirestoreEmulator = process.env.NEXT_PUBLIC_USE_FIRESTORE_EMULATOR === 'true';
  const useScraperEmulator = process.env.NEXT_PUBLIC_USE_SCRAPER_EMULATOR === 'true';

  // Determine the overall mode
  const getMode = () => {
    if (!useAuthEmulator && !useFirestoreEmulator && !useScraperEmulator) {
      return { name: 'PRODUCTION', color: 'text-green-600 bg-green-100', icon: '🚀' };
    }
    if (useAuthEmulator && useFirestoreEmulator && useScraperEmulator) {
      return { name: 'FULL EMULATOR', color: 'text-orange-600 bg-orange-100', icon: '🔧' };
    }
    if (useFirestoreEmulator && useScraperEmulator) {
      return { name: 'SAFE TESTING', color: 'text-blue-600 bg-blue-100', icon: '🧪' };
    }
    return { name: 'MIXED', color: 'text-purple-600 bg-purple-100', icon: '⚡' };
  };

  const mode = getMode();

  return (
    <div className="bg-white rounded-lg border p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Configuration Mode</h3>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${mode.color}`}>
          {mode.icon} {mode.name}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <span className="text-gray-600">Auth:</span>
          <span className={`font-medium ${useAuthEmulator ? 'text-orange-600' : 'text-green-600'}`}>
            {useAuthEmulator ? '🔧 Emulator' : '🚀 Production'}
          </span>
        </div>
        
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <span className="text-gray-600">Data Source:</span>
          <span className={`font-medium ${useFirestoreEmulator ? 'text-orange-600' : 'text-green-600'}`}>
            {useFirestoreEmulator ? '🔧 Emulator' : '🚀 Production'}
          </span>
        </div>
        
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <span className="text-gray-600">Scraper Target:</span>
          <span className={`font-medium ${useScraperEmulator ? 'text-orange-600' : 'text-green-600'}`}>
            {useScraperEmulator ? '🔧 Emulator' : '🚀 Production'}
          </span>
        </div>
      </div>

      <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
        💡 Tip: Edit <code className="font-mono bg-yellow-100 px-1 py-0.5 rounded">.env.local</code> to change modes
      </div>
    </div>
  );
}
