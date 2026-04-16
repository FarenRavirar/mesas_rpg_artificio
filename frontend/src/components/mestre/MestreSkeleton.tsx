import { TableCardSkeleton } from '../TableCard';

export function MestreSkeleton() {
  return (
    <main className="min-h-screen bg-[var(--color-artificio-blue)] text-white px-6 py-16">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, idx) => (
          <TableCardSkeleton key={idx} />
        ))}
      </div>
    </main>
  );
}
