"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import HeaderUser from "./HeaderUser";
import { motion, AnimatePresence } from "framer-motion";

export default function TopBar() {
  const pathname = usePathname();
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const setupRef = useRef<HTMLDivElement>(null);
  
  // Bestimme den Namen der aktuellen Seite basierend auf dem Pfad
  const getPageName = () => {
    if (!pathname) return "Dashboard";
    if (pathname.includes("/home")) return "Dashboard";
    if (pathname.includes("/employees")) return "Mitarbeiter";
    if (pathname.includes("/profile")) return "Profil bearbeiten";
    // Fallback fÃ¼r andere Seiten, nimmt das letzte Segment und macht den ersten Buchstaben groÃŸ
    const parts = pathname.split("/").filter(Boolean);
    const lastPart = parts[parts.length - 1] || "Dashboard";
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (setupRef.current && !setupRef.current.contains(event.target as Node)) {
        setIsSetupOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .topbar-global {
          display: flex;
          alignItems: center;
          justify-content: space-between;
          padding: 0 16px;
          height: 38px;
          background-color: #1a1a1a;
          border-bottom: 0.5px solid #333;
          color: #fff;
          font-family: system-ui, -apple-system, sans-serif;
          width: 100%;
          box-sizing: border-box;
        }
        
        /* Buttons used in the right section */
        .tb-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 4px;
          color: #ccc;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tb-btn:hover {
          background: #333;
          color: #fff;
          border-color: #555;
        }
        
        /* Dropdowns */
        .tb-dropdown {
          display: flex;
          align-items: center;
          height: 26px;
          padding: 0 8px;
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 4px;
          color: #ccc;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }
        .tb-dropdown:hover {
          background: #333;
          color: #fff;
          border-color: #555;
        }
      `}} />

      <div className="topbar-global">
        {/* Left Section: Search */}
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            backgroundColor: "#222", 
            border: "1px solid #444",
            borderRadius: "4px",
            padding: "2px 10px", // Reduced padding for lower height
            height: "26px",      // Explicitly lower height
            width: "250px"
          }}>
            <input 
              type="text" 
              placeholder="Suche ..." 
              style={{ 
                  background: "transparent", 
                  border: "none", 
                  color: "#ccc",
                  outline: "none",
                  width: "100%",
                  fontSize: "13px" // Slightly smaller font
              }} 
            />
            <i className="ti ti-search" style={{ color: "#666", fontSize: "14px" }}></i>
          </div>
        </div>

        {/* Middle Section: Page Title */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          {/* List Icon & Dynamic Page Name */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fff" }}>
            <i className="ti ti-list" style={{ fontSize: "20px" }}></i>
            <span style={{ fontWeight: 600, fontSize: "16px" }}>{getPageName()}</span>
          </div>
        </div>

        {/* Right Section: Version, Buttons, Dropdowns, User */}
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px" }}>
          
          {/* Version Info */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginRight: "10px" }}>
            <span style={{ fontWeight: 600, color: "#fff", fontSize: "12px", lineHeight: "1.2" }}>Version 5.8.0</span>
            <span style={{ color: "#888", fontSize: "10px", lineHeight: "1.2" }}>Build #7614 vom 07.05.2026 17:18</span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "6px" }}>
            <button className="tb-btn" title="Aktualisieren"><i className="ti ti-refresh" style={{ fontSize: "16px" }}></i></button>
            <button className="tb-btn" title="Nachrichten"><i className="ti ti-mail" style={{ fontSize: "16px" }}></i></button>
            <button className="tb-btn" title="Startseite"><i className="ti ti-home" style={{ fontSize: "16px" }}></i></button>
            <button className="tb-btn" title="Hilfe"><i className="ti ti-help" style={{ fontSize: "16px" }}></i></button>
          </div>

          {/* Language Dropdown */}
          <div className="tb-dropdown" style={{ gap: "6px" }}>
            <span>de</span>
            <span style={{ color: "#666", fontSize: "12px" }}>|</span>
            <i className="ti ti-chevron-down" style={{ fontSize: "14px", color: "#888" }}></i>
          </div>

          {/* Setup Dropdown */}
          <div className="tb-dropdown" style={{ gap: "6px", position: "relative" }} ref={setupRef} onClick={() => setIsSetupOpen(!isSetupOpen)}>
            <i className="ti ti-settings" style={{ fontSize: "16px" }}></i>
            <span>Setup</span>
            <i className="ti ti-chevron-down" style={{ fontSize: "14px", color: "#888", marginLeft: "4px" }}></i>
            
            <AnimatePresence>
              {isSetupOpen && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: "0",
                    marginTop: "6px",
                    minWidth: "220px",
                    background: "#1e1e1e",
                    border: "1px solid #333",
                    borderRadius: "6px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                    zIndex: 100,
                    overflow: "hidden",
                    transformOrigin: "top right",
                    display: "flex",
                    flexDirection: "column"
                  }}
                  onClick={(e) => e.stopPropagation()} // Prevent toggling when clicking inside
                >
                  <Link 
                    href="#" 
                    onClick={() => setIsSetupOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 16px",
                      color: "#ccc",
                      textDecoration: "none",
                      fontSize: "13px",
                      transition: "background 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "#2a2a2a"}
                    onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <i className="ti ti-settings" style={{ fontSize: "16px" }}></i> Programmeinstellungen
                  </Link>

                  <Link 
                    href="#" 
                    onClick={() => setIsSetupOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 16px",
                      color: "#ccc",
                      textDecoration: "none",
                      fontSize: "13px",
                      transition: "background 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "#2a2a2a"}
                    onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <i className="ti ti-users-group" style={{ fontSize: "16px" }}></i> Benutzerverwaltung
                  </Link>

                  <Link 
                    href="#" 
                    onClick={() => setIsSetupOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 16px",
                      color: "#ccc",
                      textDecoration: "none",
                      fontSize: "13px",
                      transition: "background 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "#2a2a2a"}
                    onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <i className="ti ti-shield-lock" style={{ fontSize: "16px" }}></i> Rollen und Rechte
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile (Integrating existing HeaderUser) */}
          <div className="tb-dropdown" style={{ padding: 0, border: "none", background: "transparent" }}>
             <HeaderUser />
          </div>

        </div>
      </div>
    </>
  );
}
