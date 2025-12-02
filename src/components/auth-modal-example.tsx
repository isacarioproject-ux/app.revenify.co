'use client';

import { useState } from 'react';
import { AuthFormMinimal } from './auth-form-minimal';
import { X } from 'lucide-react';

/**
 * Example usage of AuthFormMinimal component
 * This is how you can use it in a modal/dialog
 */
export function AuthModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = (userData: { email: string; name?: string }) => {
    console.log('Authentication successful:', userData);
    // Handle successful authentication (redirect, update state, etc.)
    setIsOpen(false);
  };

  return (
    <div>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Open Auth Form
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal content */}
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Auth form */}
            <AuthFormMinimal
              onSuccess={handleSuccess}
              onClose={() => setIsOpen(false)}
              initialMode="login"
            />
          </div>
        </div>
      )}
    </div>
  );
}
