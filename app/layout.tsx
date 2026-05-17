// Root layout — minimal wrapper. Each route group (auth, portal) has its own html/body.
// This is required for Next.js App Router but the actual html/body is in each group layout.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
