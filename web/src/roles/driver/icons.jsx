// Small line icons (24 x 24) for the driver screens, drawn in the current text colour. Owner: DRIVER FRONTEND.
// Usage: <Icon d={icon.check} />
export const icon = {
  shutter: "M4 4h16M5 4v16h14V4M5 8h14M5 12h14M5 16h14",
  refused: "M6 6l12 12M18 6L6 18",
  damaged: "M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8M9 6l3 3-2 2 3 3",
  dock: "M2 7h11v9H2zM13 10h4l3 3v3h-7M6 19a2 2 0 100-4 2 2 0 000 4zM17 19a2 2 0 100-4 2 2 0 000 4z",
  other: "M12 3l10 18H2zM12 10v5M12 18v.5",
  check: "M5 12l5 5 9-10",
  flag: "M5 21V4M5 4h11l-2 4 2 4H5",
  circle: "M12 3a9 9 0 100 18 9 9 0 000-18z",
  camera: "M3 8h4l2-3h6l2 3h4v11H3zM12 17a4 4 0 100-8 4 4 0 000 8z",
  noSignal:
    "M3 3l18 18M2 9a15 15 0 015-3M10 5.5A15 15 0 0122 9M5 12.5a10 10 0 014-2.3M15 10.5a10 10 0 014 2M8.5 16a5 5 0 017 0M12 20h.01",
  lock: "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 017 0v3",
  sync: "M4 12a8 8 0 0114-5.3L20 9M20 4v5h-5M20 12a8 8 0 01-14 5.3L4 15M4 20v-5h5",
};

export const Icon = ({ d, size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);
