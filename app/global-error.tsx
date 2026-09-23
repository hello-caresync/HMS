'use client';

export const runtime = 'edge';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-6 text-white">
        <h2 className="mb-4 text-2xl font-bold">Something went wrong</h2>
        <p className="mb-6 text-sm text-slate-400">
          {error?.message || 'An unexpected error occurred.'}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold transition-colors hover:bg-teal-500"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
