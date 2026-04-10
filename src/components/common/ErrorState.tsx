/**
 * ErrorState.tsx
 * ─────────────────
 * Usage:
 *   <ErrorState message="Something went wrong" />
 *   <ErrorState message="ডেটা লোড হয়নি" />
 */

import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  message: string;
}

const ErrorState = ({ message }: ErrorStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-red-500" />
      </div>
      <p className="text-sm text-red-500 dark:text-red-400 font-medium">
        {message}
      </p>
    </div>
  );
};

export default ErrorState;
