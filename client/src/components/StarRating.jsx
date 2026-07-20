const STARS = [1, 2, 3, 4, 5];

// Read-only when no onChange is passed, interactive (clickable) otherwise.
function StarRating({ value = 0, onChange }) {
  if (!onChange) {
    return (
      <span aria-hidden="true" className="text-lg leading-none text-accent">
        {STARS.map((n) => (
          <span key={n}>{n <= Math.round(value) ? "★" : "☆"}</span>
        ))}
      </span>
    );
  }

  return (
    <span role="radiogroup" className="inline-flex gap-1">
      {STARS.map((n) => (
        <button
          type="button"
          key={n}
          role="radio"
          aria-checked={n === value}
          aria-label={String(n)}
          onClick={() => onChange(n)}
          className="text-2xl leading-none text-accent"
        >
          {n <= value ? "★" : "☆"}
        </button>
      ))}
    </span>
  );
}

export default StarRating;
