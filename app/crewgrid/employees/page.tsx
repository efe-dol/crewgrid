"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';
import { 
  Home, 
  UserPlus, 
  Upload, 
  Download, 
  Search, 
  Filter,
  MoreVertical,
  Plus,
  Minus,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

export default function EmployeesPage() {
  const router = useRouter();
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const tabs = ["Stammdaten", "Kontakthistorie", "Briefe", "Angebote", "Anfragen", "Bestellungen", "Aufträge", "Lieferscheine", "Rechnungen", "Artikel", "Dokumente"];

  const [kontakte, setKontakte] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContacts() {
      const supabase = createClient();
      // Fetch contacts, filtering by 'mitarbeiter' if in contact_type, or just all for now.
      const { data, error } = await supabase
        .from('contacts')
        .select('*');
      
      if (data) {
        // Simple local filter or just use all 
        const mitarbeiter = data.filter(c => c.contact_type && c.contact_type.includes('mitarbeiter'));
        setKontakte(mitarbeiter.length > 0 ? mitarbeiter : data); // fallback to all data if none found to be safe
      }
      setLoading(false);
    }
    fetchContacts();
  }, []);

  return (
    <div 
      className="min-h-screen text-gray-300 font-sans text-xs flex justify-center items-center"
      style={{
        background: 'radial-gradient(circle at top left, rgba(231, 31, 127, 0.12), transparent 32%), radial-gradient(circle at bottom right, rgba(96, 165, 250, 0.08), transparent 26%), #000000',
        padding: '20px',
      }}
    >
      <motion.div 
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.56, ease: [0.16, 1, 0.3, 1] }}
        className="flex w-full h-[calc(100vh-40px)] border border-[#333] rounded-[10px] overflow-hidden bg-[#121212] shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
      >
        <div className="flex-shrink-0 z-10 w-[220px]">
          <Sidebar />
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden bg-[#121212]">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.52, ease: "easeOut", delay: 0.18 }}
          >
            <TopBar />
          </motion.div>
          
          <motion.main 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
            className="flex-1 flex overflow-hidden"
          >
            {/* Internal Left Sidebar */}
          <div className="w-64 bg-[#1a1a1a] border-r border-[#333] flex flex-col">
            <div className="p-2 border-b border-[#333] bg-[#1e1e1e]">
              <div className="font-semibold text-[#f3f4f6] mb-2">Ansicht</div>
              <div className="flex items-center space-x-1 mb-2">
                <input 
                  type="text" 
                  placeholder="Suche" 
                  className="w-full bg-[#121212] border border-[#444] text-[#f3f4f6] px-2 py-1 rounded-sm focus:outline-none focus:border-[#E71F7F] transition-colors text-xs placeholder-[#9ca3af]"
                />
              </div>
              <div className="grid grid-cols-2 gap-1 mb-2">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="bg-[#333] hover:bg-[#444] text-[#f3f4f6] py-1 px-2 rounded-sm border border-[#444] text-left transition-colors cursor-pointer border-none">Alle</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="bg-[#333] hover:bg-[#444] text-[#f3f4f6] py-1 px-2 rounded-sm border border-[#444] text-left transition-colors cursor-pointer border-none">Ohne</motion.button>
              </div>
              <div className="flex space-x-1">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-[#333] hover:bg-[#444] text-[#f3f4f6] p-1 rounded-sm border border-[#444] flex-1 flex justify-center transition-colors cursor-pointer border-none"><Plus className="w-3 h-3" /></motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-[#333] hover:bg-[#444] text-[#f3f4f6] p-1 rounded-sm border border-[#444] flex-1 flex justify-center transition-colors cursor-pointer border-none"><Minus className="w-3 h-3" /></motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-[#333] hover:bg-[#444] text-[#f3f4f6] p-1 rounded-sm border border-[#444] flex-1 flex justify-center transition-colors cursor-pointer border-none"><RefreshCw className="w-3 h-3" /></motion.button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 bg-[#1a1a1a]">
              <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                 className="text-[#9ca3af] italic text-[10px]"
              >
                Baumstruktur...
              </motion.div>
            </div>
          </div>

          {/* Right Main Pane */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#121212]">
            
            {/* Top Toolbar */}
            <div className="bg-[#1e1e1e] border-b border-[#333] p-1 flex items-center space-x-1">
              <motion.button whileHover={{ backgroundColor: '#333' }} className="flex items-center px-3 py-1.5 text-gray-300 rounded-sm transition-colors cursor-pointer border-none bg-transparent">
                <Home className="w-4 h-4 mr-2 text-blue-400" />
                Startseite (F1)
              </motion.button>
              <div className="w-px h-4 bg-[#444] mx-1"></div>
              <Link href="/crewgrid/new/person" passHref legacyBehavior>
                <motion.a whileHover={{ backgroundColor: '#333' }} className="flex items-center px-3 py-1.5 text-gray-300 rounded-sm transition-colors cursor-pointer border-none no-underline">
                  <UserPlus className="w-4 h-4 mr-2 text-green-400" />
                  Neuer Mitarbeiter (F2)
                </motion.a>
              </Link>
              <div className="w-px h-4 bg-[#444] mx-1"></div>
              <motion.button whileHover={{ backgroundColor: '#333' }} className="flex items-center px-3 py-1.5 text-gray-300 rounded-sm transition-colors cursor-pointer border-none bg-transparent">
                <Upload className="w-4 h-4 mr-2 text-yellow-400" />
                Daten Export
              </motion.button>
              <motion.button whileHover={{ backgroundColor: '#333' }} className="flex items-center px-3 py-1.5 text-gray-300 rounded-sm transition-colors cursor-pointer border-none bg-transparent">
                <Download className="w-4 h-4 mr-2 text-purple-400" />
                Daten Import
              </motion.button>
            </div>

            {/* Sub-toolbar */}
            <div className="bg-[#1a1a1a] border-b border-[#333] p-2 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input type="checkbox" className="w-3.5 h-3.5 bg-[#121212] border-[#555] rounded-sm accent-[#E71F7F] outline-none cursor-pointer" />
                <div className="flex items-center bg-[#121212] border border-[#444] rounded-sm pr-1 focus-within:border-[#E71F7F] transition-colors">
                  <input 
                    type="text" 
                    placeholder="Kundennummer, Name oder Firma" 
                    className="bg-transparent border-none text-gray-200 px-2 py-1 focus:outline-none w-64 text-xs placeholder-[#666]"
                  />
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="bg-[#333] hover:bg-[#444] p-1 rounded-sm ml-1 transition-colors cursor-pointer border-none">
                    <Search className="w-3 h-3 text-gray-300" />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="bg-[#333] hover:bg-[#444] p-1 rounded-sm ml-1 transition-colors cursor-pointer border-none">
                    <Filter className="w-3 h-3 text-gray-300" />
                  </motion.button>
                </div>
              </div>
              <div className="flex items-center space-x-2 border border-[#444] rounded-sm bg-[#121212] p-0.5">
                <motion.button whileHover={{ backgroundColor: '#444' }} className="px-3 py-1 bg-[#333] text-white rounded-sm transition-colors cursor-pointer border-none">Aktiv</motion.button>
                <motion.button whileHover={{ backgroundColor: '#222' }} className="px-3 py-1 text-gray-400 hover:text-gray-200 rounded-sm transition-colors cursor-pointer border-none bg-transparent">Inaktiv</motion.button>
                <motion.button whileHover={{ backgroundColor: '#222' }} className="px-3 py-1 text-gray-400 hover:text-gray-200 rounded-sm transition-colors cursor-pointer border-none bg-transparent">Archiv</motion.button>
              </div>
            </div>

            {/* Main List Area */}
            <div className="flex-1 flex relative bg-[#000]">
              <div className="flex-1 overflow-y-auto p-4 pb-0">
                <motion.div 
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                  className="border border-[#333] rounded-[6px] min-w-[600px] h-full flex flex-col bg-[#121212] shadow-sm overflow-hidden"
                >
                  
                  {/* Table Header */}
                  <div className="flex items-center bg-[#1e1e1e] border-b border-[#333] px-2 py-2 font-semibold text-[#9ca3af] shrink-0">
                    <div className="w-8 flex justify-center"><MoreVertical className="w-3 h-3" /></div>
                    <div className="w-8"></div>
                    <div className="flex-1">Mitarbeiter</div>
                    <div className="w-48 text-right pr-2">Geändert am</div>
                  </div>

                  {loading ? (
                    <div className="p-4 text-center text-gray-500">Lade Mitarbeiter...</div>
                  ) : kontakte.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">Keine Mitarbeiter gefunden.</div>
                  ) : (
                    kontakte.map((kontakt, idx) => (
                      <motion.div 
                        key={kontakt.id || idx}
                        onDoubleClick={() => router.push('/crewgrid/edit/contact/' + kontakt.id)}
                        whileHover={{ scale: 1.002, backgroundColor: '#1e1e1e' }}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 + (idx * 0.05) }}
                        className="flex items-center border-b border-[#222] px-2 py-2.5 group cursor-pointer transition-colors bg-[#121212]"
                      >
                        <div className="w-8 flex justify-center">
                          <input type="checkbox" className="w-3.5 h-3.5 bg-[#121212] border-[#555] rounded-sm accent-[#E71F7F] outline-none cursor-pointer" />
                        </div>
                        <div className="w-8 flex justify-center text-[#555] group-hover:text-[#E71F7F] transition-colors">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 flex items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#4ade80] mr-3 shadow-[0_0_8px_rgba(74,222,128,0.4)]"></div>
                          <span className="font-medium text-[#f3f4f6]">
                            {`${kontakt.last_name || ''}, ${kontakt.first_name || ''} ${kontakt.company_name ? `(${kontakt.company_name})` : ''}`.replace(/^,\s/, '').trim()}
                          </span>
                        </div>
                        <div className="w-48 text-right pr-2 text-[#9ca3af]">
                          {kontakt.updated_at ? new Date(kontakt.updated_at).toLocaleDateString('de-DE') : 'Kein Datum'}
                        </div>
                      </motion.div>
                    ))
                  )}

                  {/* Filler area */}
                  <div className="flex-1"></div>
                </motion.div>
              </div>

              {/* Alphabet Index */}
              <div className="w-6 bg-[#1a1a1a] border-l border-[#333] flex flex-col justify-between text-[10px] text-center text-[#9ca3af] py-2 overflow-y-auto">
                {alphabet.map((letter, idx) => (
                  <motion.div 
                    key={letter}
                    whileHover={{ scale: 1.2, color: '#fff', backgroundColor: '#333' }}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.3 + (idx * 0.01) }}
                    className="cursor-pointer py-0.5 shrink-0 transition-colors mx-0.5 rounded-sm"
                  >
                    {letter}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Bottom Tabs / Accordion */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="bg-[#1a1a1a] border-t border-[#333] pt-2 px-2 flex flex-wrap gap-1 shrink-0"
            >
              {tabs.map((tab, idx) => (
                <button 
                  key={tab}
                  className={`px-3 py-1.5 border border-[#333] rounded-t-sm whitespace-nowrap transition-colors cursor-pointer ${idx === 0 ? 'bg-[#333] text-white border-b-[#333]' : 'bg-[#121212] text-[#9ca3af] hover:bg-[#1e1e1e] hover:text-[#f3f4f6]'}`}
                  style={{ marginBottom: idx === 0 ? '-1px' : '0' }}
                >
                  {tab}
                </button>
              ))}
            </motion.div>
            
            {/* Tab content area placeholder */}
            <div className="h-40 bg-[#1e1e1e] p-2 text-[#888] shrink-0 border-t border-[#333]">
              {/* Content area placeholder */}
            </div>

            {/* Status bar */}
            <div className="bg-[#121212] border-t border-[#333] px-3 py-1 flex justify-between text-[#888] shrink-0 text-[10px]">
              <div>Bereit</div>
              <div>Einträge: {kontakte.length}</div>
            </div>

          </div>
        </motion.main>
      </div>
      </motion.div>
    </div>
  );
}