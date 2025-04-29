import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-black dark:bg-black py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">uevent</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-200">
              Connect with like-minded people through events that matter to you.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">COMPANY</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/about" className="text-sm text-gray-600 dark:text-gray-200 hover:text-blue-600">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-600 dark:text-gray-200 hover:text-blue-600">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">EVENTS</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/events" className="text-sm text-gray-600 dark:text-gray-200 hover:text-blue-600">
                  Browse Events
                </Link>
              </li>
              <li>
                <Link href="/events/create" className="text-sm text-gray-600 dark:text-gray-200 hover:text-blue-600">
                  Create Event
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">LEGAL</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 dark:text-gray-200 hover:text-blue-600">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-600 dark:text-gray-200 hover:text-blue-600">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-8">
          <p className="text-center text-sm text-gray-600 dark:text-gray-200">
            &copy; {new Date().getFullYear()} uevent. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}