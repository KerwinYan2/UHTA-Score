import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UHTA Score — 网球记分",
  description: "超高压网球俱乐部内部比赛现场记分工具",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "UHTA Score",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FFFFFF",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <div className="app-shell safe-top">{children}</div>
      </body>
    </html>
  );
}
