"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

export default function HeaderUser() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Try fetching profile to get first name
        const { data: prof } = await supabase
          .from("users")
          .select("first_name, last_name, email")
          .eq("auth_user_id", user.id)
          .single();
          
        if (prof) {
          setProfile(prof);
        }
      }
    }
    loadUser();

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [supabase]);

  const handleLogout = async () => {
    // Attempt backend logout to clear session limits
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}

    await supabase.auth.signOut();
    document.cookie = 'has_session=; Max-Age=0; path=/';
    document.cookie = 'access_token=; Max-Age=0; path=/';
    document.cookie = 'refresh_token=; Max-Age=0; path=/';
    localStorage.removeItem('has_session');
    
    window.location.href = "/crewgrid/home";
  };

  const displayName = profile?.first_name 
    ? `${profile.first_name} ${profile.last_name || ""}`.trim() 
    : profile?.email || "Benutzer";

  return (
    <div className="header-user" ref={dropdownRef} style={{ position: "relative", marginLeft: "auto" }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "#2a2a2a",
          border: "1px solid #444",
          color: "#ccc",
          cursor: "pointer",
          fontSize: "13px",
          padding: "0 8px",
          height: "26px",
          borderRadius: "4px",
          transition: "all 0.2s"
        }}
        onMouseOver={(e) => { e.currentTarget.style.background = "#333"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#555"; }}
        onMouseOut={(e) => { e.currentTarget.style.background = "#2a2a2a"; e.currentTarget.style.color = "#ccc"; e.currentTarget.style.borderColor = "#444"; }}
      >
        <i className="ti ti-logout" style={{ fontSize: "16px" }}></i>
        <span>{displayName}</span>
        <i className="ti ti-chevron-down" style={{ fontSize: "10px", color: "#888", marginLeft: "4px" }}></i>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: "100%",
              right: "0",
              marginTop: "4px",
              minWidth: "160px",
              background: "#1e1e1e",
              border: "1px solid #333",
              borderRadius: "6px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              zIndex: 100,
              overflow: "hidden",
              transformOrigin: "top right"
            }}
          >
            <Link 
              href="/crewgrid/user/profile" 
              onClick={() => setIsOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                color: "#ccc",
                textDecoration: "none",
                fontSize: "13px",
                borderBottom: "1px solid #2a2a2a",
                transition: "background 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "#2a2a2a"}
              onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
            >
              <i className="ti ti-user"></i> Profil
            </Link>
            <button 
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                width: "100%",
                background: "transparent",
                border: "none",
                color: "#ef4444",
                cursor: "pointer",
                fontSize: "13px",
                textAlign: "left",
                transition: "background 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "#2a2a2a"}
              onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
            >
              <i className="ti ti-logout"></i> Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}