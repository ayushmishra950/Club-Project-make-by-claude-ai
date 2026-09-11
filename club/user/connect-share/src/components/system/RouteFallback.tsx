/**
 * Shown while a lazily loaded route chunk is being fetched.
 *
 * Every page is now a separate chunk, so there is a brief gap on first visit
 * to a route. A skeleton keeps the layout stable instead of collapsing to
 * nothing and then jumping.
 */
export const RouteFallback = () => (
  <div className="mx-auto w-full max-w-5xl animate-pulse space-y-4 p-6" aria-busy="true" aria-label="Loading">
    <div className="h-8 w-1/3 rounded bg-muted" />
    <div className="h-4 w-2/3 rounded bg-muted" />
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="h-40 rounded-lg bg-muted" />
      <div className="h-40 rounded-lg bg-muted" />
    </div>
    <div className="h-4 w-1/2 rounded bg-muted" />
  </div>
);

export default RouteFallback;
