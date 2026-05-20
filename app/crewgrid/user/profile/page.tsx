"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import TopBar from '@/components/TopBar';
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  
  // States representing DB fields
  const [email, setEmail] = useState("");
  const [vorname, setVorname] = useState("");
  const [nachname, setNachname] = useState("");
  const [kuerzel, setKuerzel] = useState("");
  const [telefon, setTelefon] = useState("");
  const [mobil, setMobil] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  
  // Available employees
  const [employeesList, setEmployeesList] = useState<any[]>([]);

  // Password change states
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");

  useEffect(() => {
    async function loadUser() {
      // 1. Get current logged-in Auth User
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("Auth error:", authError);
        return;
      }
      
      console.log("Logged in auth user ID:", user.id);
      
      // Fetch employees for dropdown
      const { data: emps, error: empErr } = await supabase
        .from('employees')
        .select('id, first_name, last_name, status')
        .order('last_name', { ascending: true });
        
      if (!empErr && emps) {
        setEmployeesList(emps);
      }

      // 2. Fetch User Profile from our custom schema
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();
        
      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        console.log("Profile data loaded:", profile);
      }
        
      if (profile) {
        setUserId(profile.id);
        setEmail(profile.email || "");
        setVorname(profile.first_name || "");
        setNachname(profile.last_name || "");
        setKuerzel(profile.initials || "");
        setTelefon(profile.phone || "");
        setMobil(profile.mobile || "");
        setEmployeeId(profile.employee_id || "");
      }
      setPageLoading(false);
    }
    loadUser();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    setSuccessMsg("");
    
    try {
      // Update via secure API to bypass RLS admin policy for own profile
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          first_name: vorname,
          last_name: nachname,
          initials: kuerzel,
          phone: telefon,
          mobile: mobil,
          employee_id: employeeId
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Fehler beim Speichern');
      }

      // Handle password change if filled
      if (password) {
        if (password === passwordRepeat) {
          const { error: passErr } = await supabase.auth.updateUser({ password });
          if (passErr) throw passErr;
          
          setPassword("");
          setPasswordRepeat("");
        } else {
          alert("Passwörter stimmen nicht überein!");
          setLoading(false);
          return;
        }
      }
      
      setSuccessMsg("Profil erfolgreich gespeichert!");
      // Hide message nicely
      setTimeout(() => setSuccessMsg(""), 4000);
      
    } catch (err: any) {
      alert("Fehler beim Speichern: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = 'has_session=; Max-Age=0; path=/';
    document.cookie = 'access_token=; Max-Age=0; path=/';
    document.cookie = 'refresh_token=; Max-Age=0; path=/';
    localStorage.removeItem('has_session');
    window.location.href = "/crewgrid/home"; 
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .profile-container {
          padding: 24px;
          color: var(--color-text-primary);
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .section-title {
          background: #2a2a2a;
          padding: 8px 12px;
          font-size: 14px;
          font-weight: 600;
          margin-top: 24px;
          margin-bottom: 16px;
          border-radius: 4px;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          align-items: flex-start;
          background: #1a1a1a;
          padding: 24px;
          border-radius: 8px;
          border: 1px solid #333;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .input-group label {
          font-size: 12px;
          color: #aaa;
          font-weight: 500;
        }
        .input-el {
          background: #111;
          border: 1px solid #333;
          padding: 10px 12px;
          color: #fff;
          font-size: 14px;
          border-radius: 6px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-el:disabled {
          background: #222;
          color: #666;
          cursor: not-allowed;
        }
        .input-el:focus:not(:disabled) {
          border-color: #E71F7F;
          box-shadow: 0 0 0 2px rgba(231, 31, 127, 0.15);
        }
        
        .footer-bar {
          background: #111;
          padding: 16px 24px;
          display: flex;
          gap: 12px;
          border-top: 1px solid #222;
        }
        .btn-save {
          background: #E71F7F;
          color: #fff;
          border: none;
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border-radius: 6px;
          transition: background 0.2s, transform 0.1s;
        }
        .btn-save:hover { background: #C8196E; }
        .btn-save:disabled { background: #555; cursor: not-allowed; }
        
        .btn-cancel {
          background: transparent;
          color: #aaa;
          border: 1px solid #333;
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border-radius: 6px;
          transition: background 0.2s, color 0.2s;
        }
        .btn-cancel:hover { background: #222; color: #fff; }
        
        .toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #4ade80;
          color: #000;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          box-shadow: 0 10px 24px rgba(74, 222, 128, 0.3);
          animation: slideUp 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          z-index: 1000;
        }
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .fade-out {
          animation: slideDown 300ms ease-in forwards !important;
        }
        @keyframes slideDown {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(100px); opacity: 0; }
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top-color: #E71F7F;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .loading-overlay {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          gap: 16px;
          color: #aaa;
          font-size: 14px;
          margin-top: 64px;
        }

        .app { height: 100vh; display: flex; font-family: -apple-system, sans-serif; background: #121212; flex-direction: column;}
      `}} />
      
      <div className="app">
        <TopBar />
        
        {successMsg && (
          <div className="toast">{successMsg}</div>
        )}
        
        {pageLoading ? (
          <motion.div 
            className="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="spinner"></div>
            <div>Lade Benutzerdaten...</div>
          </motion.div>
        ) : (
          <motion.form 
            className="profile-container" 
            onSubmit={handleSave}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="section-title">Benutzerdaten</div>
            
            <div className="form-grid">
            {/* Column 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label>E-Mail (Benutzername)</label>
                <input className="input-el" value={email} disabled />
              </div>
              <div className="input-group">
                <label>Vorname</label>
                <input className="input-el" value={vorname} onChange={e => setVorname(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Nachname</label>
                <input className="input-el" value={nachname} onChange={e => setNachname(e.target.value)} required />
              </div>
            </div>
            
            {/* Column 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label>Kürzel (max. 4 Zeichen)</label>
                <input className="input-el" value={kuerzel} onChange={e => setKuerzel(e.target.value)} maxLength={4} required />
              </div>
              <div className="input-group">
                <label>Telefonnummer</label>
                <input className="input-el" value={telefon} onChange={e => setTelefon(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Mobil</label>
                <input className="input-el" value={mobil} onChange={e => setMobil(e.target.value)} />
              </div>
            </div>
            
            {/* Column 3 - Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group" style={{ marginTop: '0' }}>
                <label>Neues Passwort (optional)</label>
                <input className="input-el" type="password" placeholder="Passwort ändern..." value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Passwort wiederholen</label>
                <input className="input-el" type="password" placeholder="Passwort wiederholen..." value={passwordRepeat} onChange={e => setPasswordRepeat(e.target.value)} />
                {password && password !== passwordRepeat && (
                  <span style={{color: '#ef4444', fontSize: '11px', marginTop: '4px'}}>Passwörter stimmen nicht überein</span>
                )}
              </div>
            </div>
          </div>

          <div className="section-title">Erweiterte Verknüpfung</div>
          <div style={{ background: "#1a1a1a", padding: "24px", borderRadius: "8px", border: "1px solid #333", maxWidth: "600px" }}>
            <div className="input-group">
              <label>Mitarbeiter:</label>
              <select 
                className="input-el" 
                value={employeeId} 
                onChange={(e) => setEmployeeId(e.target.value)}
                style={{ appearance: "auto", cursor: "pointer", color: employeeId ? '#fff' : '#888' }}
              >
                <option value="">-- Bitte wählen --</option>
                {employeesList.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} {emp.status !== 'Aktiv' ? `(${emp.status})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ marginTop: "16px", fontSize: "13px", lineHeight: "1.5" }}>
              {!employeeId && (
                <div style={{ color: "#ef4444", fontWeight: "700", marginBottom: "4px" }}>FEHLT!</div>
              )}
              <div style={{ color: "#fff" }}>
                Zur Verwendung des persönlichen Kalenders muss für jeden Benutzer ein Mitarbeiter angelegt sein. 
                Bitte in den Stammdaten einen Mitarbeiter anlegen und hier auswählen.
              </div>
              <div style={{ color: "#e71f7f", marginTop: "8px" }}>
                Danach einmal Aus- und Einloggen!
              </div>
              <div style={{ color: "#fff", marginTop: "4px" }}>
                Übrigens: Genau so sind auch Tätigkeiten im Job mit dem Benutzer verbunden...
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }}></div>

          <div className="footer-bar">
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', borderTopColor: '#fff' }}></div>
                  Speichert...
                </div>
              ) : "Änderungen speichern"}
            </button>
            <button type="button" className="btn-cancel" onClick={() => router.back()}>
              Abbrechen
            </button>
          </div>
        </motion.form>
        )}
      </div>
    </>
  );
}