import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GUESTLIST.TV | High-Fidelity Broadcast Engine",
    template: "%s | GUESTLIST.TV",
  },
  description: "Uncompressed low-latency live streaming & high-fidelity event broadcast platform.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/G_logo.png",
  },
  openGraph: {
    title: "GUESTLIST.TV | High-Fidelity Broadcast Engine",
    description: "Uncompressed low-latency live streaming & high-fidelity event broadcast platform.",
    siteName: "GUESTLIST.TV",
    images: [
      {
        url: "/G_logo.png",
        width: 800,
        height: 800,
        alt: "GUESTLIST Logo",
      },
    ],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://customer-xfdlafmmuylrdexv.cloudflarestream.com; media-src 'self' blob: https://customer-xfdlafmmuylrdexv.cloudflarestream.com; connect-src 'self' https://api.stripe.com https://www.guestlist.tv https://customer-xfdlafmmuylrdexv.cloudflarestream.com https://*.livekit.cloud wss://*.livekit.cloud https://zcldklsqbhkguuyiyyjd.supabase.co wss://zcldklsqbhkguuyiyyjd.supabase.co; frame-src https://js.stripe.com https://customer-xfdlafmmuylrdexv.cloudflarestream.com;"
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-black text-white min-h-screen selection:bg-[#D4AF37] selection:text-black flex flex-col justify-between`}
      >
        {/* Global Pipeline Header Navigation - Single Unified Sticky Header */}
        <header className="w-full border-b border-neutral-900 bg-neutral-950/90 backdrop-blur-md sticky top-0 z-50 px-6 h-16 flex items-center justify-between font-mono">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Image src="/G_logo.png" alt="Guestlist" width={32} height={32} className="rounded" />
              <span className="text-xs font-black tracking-widest text-white">
                GUESTLIST<span className="text-[#D4AF37]">.TV</span>
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/submit"
              className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-[#D4AF37] text-[10px] font-black tracking-widest text-[#D4AF37] rounded-lg transition-colors"
            >
              + SUBMIT MUSIC
            </Link>
            <Link
              href="/admin/submissions"
              className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 hover:text-white text-[10px] font-black tracking-widest text-neutral-400 rounded-lg transition-colors"
            >
              QUEUE
            </Link>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="w-full border-t border-neutral-900 bg-neutral-950 py-6 px-6 text-center text-[10px] text-neutral-600 font-mono">
          © GUESTLIST.TV — UNCOMPRESSED UNDERGROUND BROADCASTING ENGINE
        </footer>
      </body>
    </html>
  );
}// Deploy trigger Wed Aug  5 17:47:46 BST 2026
// redeploy Wed Aug  5 22:32:00 BST 2026
// test
// token fix Wed Aug  5 23:45:45 BST 2026
// fix Wed Aug  5 23:58:56 BST 2026
// aspect ratio fix Thu Aug  6 10:14:46 BST 2026
