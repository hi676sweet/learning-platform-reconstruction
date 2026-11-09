import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Skillroom — Make room for what's next",
  description: "An independent career-learning platform reconstruction with fictional classes and simulated enrollment.",
  icons: { icon: "/favicon.svg" }
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
