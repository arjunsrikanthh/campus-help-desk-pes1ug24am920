import type { Metadata } from "next";
import "./style.css";
export const metadata: Metadata = { title: "Campus Help Desk", description: "Ask a question and help your campus community." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
