import "./globals.css";
import { AuthProvider } from "@/components/AuthContext";

export const metadata = {
    title: "Flux App",
    description: "Generate stunning images locally with Flux.1",
};

export default function RootLayout({ children }) {
    return (
          <html lang="en">
            <head>
              <link rel="preconnect" href="https://fonts.googleapis.com" />
              <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
        <body>
              <AuthProvider>
                <div className="layout-container">
    {children}
      </div>
      </AuthProvider>
      </body>
      </html>
    );
}
