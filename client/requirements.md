## Packages
three | Core 3D library
@react-three/fiber | React renderer for Three.js
@react-three/drei | Helpers for React Three Fiber (OrbitControls, etc.)
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility for merging Tailwind CSS classes

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["var(--font-display)"],
  mono: ["var(--font-mono)"],
  sans: ["var(--font-sans)"],
}
The app handles large local video files via URL.createObjectURL().
The backend is only used for saving layout configurations (JSON).
