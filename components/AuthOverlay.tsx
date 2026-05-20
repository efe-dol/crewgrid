"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AuthOverlay() {
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [didLogin, setDidLogin] = useState(false);
  const [user, setUser] = useState<unknown | null>(null);
  
  // Step 1: Login to Supabase
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  // Step 2: License Selection
  const [licenses, setLicenses] = useState<any[]>([]);
  const [selectedLicense, setSelectedLicense] = useState<string>("");
  const [isLicenseLoading, setIsLicenseLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check if we already have a session
    const checkSession = async () => {
      // Use standard Supabase auth check AND our localStorage flag
      const hasLocalSession = localStorage.getItem('has_session') === 'true';
      if (hasLocalSession) {
        setUser({ loggedIn: true });
        setDidLogin(true);
        setIsSessionLoading(false);
        return;
      }

      // Check if user is logged into Supabase but missing the custom license session
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setStep(2);
        setIsLicenseLoading(true);
        try {
          const res = await fetch('/api/auth/licenses');
          if (res.ok) {
            const dataLicenses = await res.json();
            setLicenses(dataLicenses);
            if (dataLicenses.length > 0) {
              setSelectedLicense(dataLicenses[0].id);
            }
          }
        } catch (err) {
          console.error(err);
        }
        setIsLicenseLoading(false);
      }
      
      setIsSessionLoading(false);
    };
    checkSession();
  }, [supabase.auth]);

  const handleSupabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        setError(authError.message === 'Invalid login credentials' ? 'Ungültige Anmeldedaten.' : authError.message);
        // Optional: call a brute-force logging endpoint here
        setIsSubmitting(false);
        return;
      }

      // Success: advance to Step 2
      setStep(2);
      setIsLicenseLoading(true);

      // Fetch licenses
      const res = await fetch('/api/auth/licenses');
      if (!res.ok) throw new Error('Konnte Lizenzen nicht laden.');
      
      const dataLicenses = await res.json();
      setLicenses(dataLicenses);
      if (dataLicenses.length > 0) {
        setSelectedLicense(dataLicenses[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Verbindung fehlgeschlagen oder Lizenzen konnten nicht geladen werden.');
    } finally {
      setIsSubmitting(false);
      setIsLicenseLoading(false);
    }
  };

  const handleSelectLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLicense) return;

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId: selectedLicense })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Fehler bei der Lizenzbuchung.');
        setIsSubmitting(false);
        return;
      }

      localStorage.setItem('has_session', 'true');
      setUser(data.user);
      setDidLogin(true);
      setIsSubmitting(false);
      
      // Delay refresh slightly to allow animation
      setTimeout(() => {
        router.refresh();
      }, 300);
    } catch (err) {
      setError('Verbindung zum Server fehlgeschlagen.');
      setIsSubmitting(false);
    }
  };

  if (isSessionLoading) return <div className="auth-overlay-loading">Lade...</div>;
  if (user && didLogin) {
    // Show a closing animation or just null if animation is handled elsewhere
    // Actually, just return null so it stays hidden
    return null;
  }

  return (
    <div className={`auth-overlay ${didLogin && user ? "auth-overlay--closing" : "auth-overlay--entering"}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        .auth-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(18, 18, 18, 0.85);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: auth-overlay-fade-in 240ms ease-out both;
        }
        .auth-overlay--closing { animation: auth-overlay-fade-out 320ms ease-in both; }
        .auth-overlay-loading {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: radial-gradient(circle at top, rgba(231, 31, 127, 0.12), rgba(18, 18, 18, 1) 60%);
          color: #E71F7F;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .auth-overlay-loading::after {
          content: "";
          width: 14px;
          height: 14px;
          margin-left: 10px;
          border-radius: 999px;
          border: 2px solid rgba(231, 31, 127, 0.25);
          border-top-color: #E71F7F;
          animation: auth-spin 800ms linear infinite;
        }
        .auth-modal {
          background: linear-gradient(180deg, rgba(30, 30, 30, 0.98), rgba(18, 18, 18, 0.98));
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-top: 4px solid #E71F7F;
          border-radius: 18px;
          padding: 32px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.55);
          display: flex;
          flex-direction: column;
          gap: 20px;
          transform-origin: center;
          animation: auth-modal-rise 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .auth-overlay--closing .auth-modal { animation: auth-modal-fall 260ms ease-in both; }
        .auth-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #fff;
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .auth-logo i { color: #f0a500; font-size: 28px; }
        .auth-title {
          text-align: center;
          color: #ccc;
          font-size: 14px;
          margin-top: -16px;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .auth-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .auth-group label {
          color: #aaa;
          font-size: 12px;
          font-weight: 500;
        }
        .auth-input, .auth-select {
          background: #121212;
          border: 1px solid #333;
          padding: 10px 12px;
          border-radius: 10px;
          color: #fff;
          font-size: 14px;
          outline: none;
        }
        .auth-input:focus, .auth-select:focus {
          border-color: #E71F7F;
          box-shadow: 0 0 0 3px rgba(231, 31, 127, 0.15);
        }
        .auth-error {
          color: #ef4444;
          font-size: 13px;
          text-align: center;
          background: rgba(239, 68, 68, 0.1);
          padding: 8px;
          border-radius: 4px;
        }
        .auth-btn {
          background: #E71F7F;
          color: #fff;
          border: none;
          padding: 12px;
          border-radius: 10px;
          font-weight: 500;
          cursor: pointer;
          margin-top: 8px;
        }
        .auth-btn:hover { background: #C8196E; }
        .auth-btn:disabled { background: #555; cursor: not-allowed; }
        @keyframes auth-overlay-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes auth-overlay-fade-out { from { opacity: 1; } to { opacity: 0; } }
        @keyframes auth-modal-rise {
          from { opacity: 0; transform: translateY(24px) scale(0.96); filter: blur(6px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes auth-modal-fall {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(16px) scale(0.98); }
        }
        @keyframes auth-spin { to { transform: rotate(360deg); } }
      `}} />
      <div className="auth-modal">
        <div className="auth-logo">
          <i className="ti ti-bolt" style={{color: '#E71F7F'}}></i> Crewgrid
        </div>
        
        {step === 1 ? (
          <>
            <div className="auth-title">Bitte melde dich an, um fortzufahren</div>
            <form className="auth-form" onSubmit={handleSupabaseLogin}>
              {error && <div className="auth-error">{error}</div>}
              
              <div className="auth-group">
                <label>E-Mail</label>
                <input 
                  type="email" 
                  className="auth-input" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="auth-group">
                <label>Passwort</label>
                <input 
                  type="password" 
                  className="auth-input" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <button 
                type="submit" 
                className="auth-btn" 
                disabled={isSubmitting || !email || !password}
              >
                {isSubmitting ? "Anmelden..." : "Login"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="auth-title">Lizenz auswählen</div>
            <form className="auth-form" onSubmit={handleSelectLicense}>
              {error && <div className="auth-error">{error}</div>}
              
              {isLicenseLoading ? (
                <div style={{ color: "#aaa", textAlign: "center", fontSize: 13 }}>Lade Lizenzen...</div>
              ) : (
                <div className="auth-group">
                  <label>Verfügbare Lizenzen</label>
                  <select
                    className="auth-select"
                    value={selectedLicense}
                    onChange={(e) => setSelectedLicense(e.target.value)}
                    required
                  >
                    <option value="" disabled>Bitte eine Lizenz wählen...</option>
                    {licenses.map(lic => {
                      const maxSlots = lic.max_concurrent_users;
                      const freeSlots = maxSlots ? Math.max(0, maxSlots - lic.active_users) : '∞';
                      const disabled = maxSlots && freeSlots === 0;

                      return (
                        <option key={lic.id} value={lic.id} disabled={disabled}>
                          {lic.name} ({lic.active_users} aktiv, {freeSlots} frei)
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <button 
                type="submit" 
                className="auth-btn" 
                disabled={isSubmitting || isLicenseLoading || !selectedLicense}
              >
                {isSubmitting ? "Session wird erstellt..." : "Mit dieser Lizenz anmelden"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}