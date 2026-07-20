function RatingBadge({ avg, count }) {
  if (!count) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-pill bg-accent-soft px-3 py-0.5 text-sm font-semibold text-accent">
      <span aria-hidden="true">★</span>
      {avg.toFixed(1)}
      <span className="font-normal text-text-secondary">({count})</span>
    </span>
  );
}

export default RatingBadge;
