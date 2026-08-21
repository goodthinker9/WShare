export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">WS</span>
            </div>
            <span className="text-sm font-medium text-gray-600">
              WolloShare &copy; {new Date().getFullYear()}
            </span>
          </div>
          <p className="text-sm text-gray-400">
            Wollo University Academic Resource Sharing Platform
          </p>
        </div>
      </div>
    </footer>
  );
}

