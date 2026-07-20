const SIZE = {
  lg: "h-16 w-16 text-2xl",
  sm: "h-10 w-10 text-base",
};

function Avatar({ src, name, size = "sm" }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`${SIZE[size]} shrink-0 rounded-full border border-dashed border-border object-cover`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`${SIZE[size]} flex shrink-0 items-center justify-center rounded-full border border-dashed border-border bg-accent-soft font-semibold text-accent`}
    >
      {name?.charAt(0)?.toUpperCase()}
    </div>
  );
}

export default Avatar;
