"use client";

import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: "🏠" },
    { name: "Orders History", href: "/orders-history", icon: "📄" },
    { name: "Fraud Check", href: "/fraud-check", icon: "🛡️" },
  ];

  return (
    <div style={{
      width: "260px",
      backgroundColor: "#111827",
      color: "#ffffff",
      minHeight: "100vh",
      padding: "24px 16px",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box"
    }}>
      {/* Brand Title */}
      <div style={{ marginBottom: "32px", paddingLeft: "8px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "bold", margin: 0, letterSpacing: "0.5px" }}>
          Moto Charm BD
        </h1>
      </div>

      {/* Navigation Links */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "10px",
                textDecoration: "none",
                fontWeight: "500",
                fontSize: "15px",
                backgroundColor: isActive ? "#2563eb" : "transparent",
                color: isActive ? "#ffffff" : "#d1d5db",
                transition: "background 0.2s"
              }}
            >
              <span style={{ fontSize: "18px" }}>{item.icon}</span>
              <span>{item.name}</span>
            </a>
          );
        })}
      </nav>

      {/* Footer info */}
      <div style={{ borderTop: "1px solid #1f2937", paddingTop: "16px", textAlign: "center", fontSize: "12px", color: "#9ca3af" }}>
        Full Access Mode
      </div>
    </div>
  );
}
