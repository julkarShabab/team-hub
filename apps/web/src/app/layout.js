import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Team Hub",
  description: "Collaborative workspace for teams",
};

export default function RootLayout({ children }) {
  // Ping backend on app load to wake it up
  if (typeof window !== "undefined") {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health`).catch(() => {});
  }
  return (
    <html lang="en">
      <body className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1e293b",
              color: "#f1f5f9",
              borderRadius: "10px",
              border: "1px solid #334155",
            },
          }}
        />
      </body>
    </html>
  );
}
