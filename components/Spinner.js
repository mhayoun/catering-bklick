export function Spinner({ className = 'h-8 w-8' }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`${className} animate-spin rounded-full border-4 border-teal/20 border-t-teal`}
    />
  );
}

export function LoadingScreen({ className = '' }) {
  return (
    <div className={`mx-auto max-w-4xl px-4 py-16 flex justify-center ${className}`}>
      <Spinner className="h-10 w-10" />
    </div>
  );
}
