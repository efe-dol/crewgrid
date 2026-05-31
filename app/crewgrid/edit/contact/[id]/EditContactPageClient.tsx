"use client";

import React, { useState, useMemo } from "react";
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  User, 
  MapPin, 
  Save, 
  X, 
  FileText, 
  Briefcase, 
  History, 
  Calendar, 
  CreditCard,
  ChevronRight,
  ShieldAlert,
  Plus,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateContactAction } from '@/app/actions/update-contact-action';

interface EditContactPageClientProps {
  initialData: any;
  contactId: string;
  userId: string;
  userRole: string;
}

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const tabVariants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, x: 10, transition: { duration: 0.1 } },
};

const containerVariants = {
  visible: {
    transition: {
      staggerChildren: 0.03,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export default function EditContactPage({ initialData, contactId, userId, userRole }: EditContactPageClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const [contactTypes, setContactTypes] = useState<string[]>([]);
  const [entityType, setEntityType] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('Stammdaten');

  // Form State
  const [formData, setFormData] = useState({
    salutation: '-',
    title: '',
    vorname: '',
    nachname: '',
    firma: '',
    abteilung: '',
    position: '',
    geburtstag: '',
    spitzname: '',
    briefliche_anrede: '',
    search_index: '',
    klasse: '',
    notizen: ''
  });

  const [addresses, setAddresses] = useState<any[]>([]);
  const [communications, setCommunications] = useState<any[]>([]);
  const [primaryLanguage, setPrimaryLanguage] = useState('deutsch');

  React.useEffect(() => {
    // Initialize state from initialData prop (fetched server-side)
    if (!initialData) return;

    // Map database back to UI format
    setEntityType(initialData.entity_type.charAt(0).toUpperCase() + initialData.entity_type.slice(1));
    const cTypes = (initialData.contact_type || []).map((t: string) => t.charAt(0).toUpperCase() + t.slice(1));
    setContactTypes(cTypes.length > 0 ? cTypes : ['Mitarbeiter']);
    
    setFormData({
      salutation: initialData.salutation || '-',
      title: initialData.title || '',
      vorname: initialData.first_name || '',
      nachname: initialData.last_name || '',
      firma: initialData.company || '',
      abteilung: initialData.department || '',
      position: initialData.position || '',
      geburtstag: initialData.birthday || '',
      spitzname: initialData.nickname || '',
      briefliche_anrede: initialData.greeting || '',
      search_index: initialData.search_index?.join(', ') || '',
      klasse: initialData.current_class || '',
      notizen: initialData.notes || ''
    });
    setAddresses(initialData.addresses || []);
    setCommunications(initialData.communication || []);
    setPrimaryLanguage(initialData.primary_language || 'deutsch');
  }, [initialData]);

  const handleContactTypeChange = (type: string) => {
    setContactTypes(prev => {
      let next;
      if (prev.includes(type)) {
        next = prev.filter(t => t !== type);
      } else {
        next = [...prev, type];
      }
      return next.length > 0 ? next : prev; // keep at least one selected
    });
  };

  const sections = useMemo(() => {
    const base = ['Stammdaten'];
    if (contactTypes.includes('Mitarbeiter')) {
      base.push('Mitarbeiterdaten');
    }
    if (contactTypes.includes('Kunde') || contactTypes.includes('Lieferant')) {
      base.push('Konditionen');
    }
    base.push('Dokumente', 'Historie');
    
    // Auto-adjust active tab if the current one gets removed
    if (!base.includes(activeTab)) {
      setActiveTab('Stammdaten');
    }
    
    return base;
  }, [contactTypes, activeTab]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Prepare update data object
      const updateData = {
        entity_type: entityType.toLowerCase(),
        contact_type: contactTypes.map(t => t.toLowerCase()),
        salutation: formData.salutation,
        title: formData.title,
        first_name: formData.vorname,
        last_name: formData.nachname,
        company: formData.firma,
        department: formData.abteilung,
        position: formData.position,
        birthday: formData.geburtstag,
        nickname: formData.spitzname,
        greeting: formData.briefliche_anrede,
        current_class: formData.klasse,
        notes: formData.notizen,
        primary_language: primaryLanguage,
        addresses: addresses || [],
        communication: communications || [],
        search_index: formData.search_index ? formData.search_index.split(',').map(s => s.trim()).filter(Boolean) : [],
        updated_at: new Date().toISOString()
      };

      // Call server action for authorization check + update
      const result = await updateContactAction({ contactId, userId, role: userRole, updatedData: updateData });
      
      if (!result.success) {
        alert(result.error);
        setIsSaving(false);
        return;
      }
      
      router.push('/crewgrid/employees');
    } catch (err: any) {
      console.error("Fehler beim Speichern:", err);
      alert("Fehler beim Speichern: " + (err?.message || JSON.stringify(err)));
    } finally {
      setIsSaving(false);
    }
  };

  const entityTypesList = [
    { id: 'Person', icon: User },
    { id: 'Firma', icon: Building2 },
    { id: 'Veranstaltungsort', icon: MapPin },
  ];

  const contactTypesList = ['Kunde', 'Lieferant', 'Partner', 'Freelancer', 'Mitarbeiter'];

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        :root {
          --color-border-tertiary: #333333;
          --color-border-secondary: #444444;
          --color-background-primary: #121212;
          --color-background-secondary: #1e1e1e;
          --color-text-primary: #f3f4f6;
          --color-text-secondary: #9ca3af;
          --border-radius-md: 6px;
          --border-radius-lg: 10px;
          --font-sans: system-ui, -apple-system, sans-serif;
        }
        body { font-family: var(--font-sans); margin: 0; background-color: #000000; padding: 20px; box-sizing: border-box; }
        .app { display: flex; height: calc(100vh - 40px); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); overflow: hidden; background: var(--color-background-primary); }
        .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
      `
      }} />

      <div className="app">
        <Sidebar />

        <div className="main">
          <TopBar />

          {/* Topbar for the Page Editor */}
          <div className="px-6 py-3 bg-[#121212] border-b border-[#333] flex justify-between items-center shrink-0">
            <span className="text-[15px] font-medium text-gray-100 flex items-center gap-2">
              <Link href="/crewgrid/employees" className="text-gray-400 hover:text-gray-100 transition-colors">
                Kontakte
              </Link>
              <ChevronRight size={14} className="text-gray-500" />
              Kontakt bearbeiten
            </span>
            <div className="flex gap-2">
              <Link href="/crewgrid/employees" className="flex items-center gap-1.5 px-3 py-1.5 border border-[#444] rounded-md text-xs text-gray-200 hover:bg-[#1e1e1e] transition-colors">
                <X size={14} /> Abbrechen
              </Link>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E71F7F] bg-[#E71F7F] rounded-md text-xs text-white font-medium hover:bg-[#C8196E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Save size={14} /> {isSaving ? 'Speichert...' : 'Speichern'}
              </button>
            </div>
          </div>

          <motion.div 
            className="content flex"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Inner Left Sidebar (Dynamic) */}
            <div className="w-56 shrink-0 bg-[#1a1a1a] border-r border-[#333] flex flex-col pt-4 overflow-y-auto">
              <div className="px-5 mb-2 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                Sektionen
              </div>
              <div className="flex flex-col">
                <AnimatePresence>
                  {sections.map(sec => {
                    const isActive = activeTab === sec;
                    let SecIcon = FileText;
                    if (sec === 'Stammdaten') SecIcon = User;
                    if (sec === 'Mitarbeiterdaten') SecIcon = Briefcase;
                    if (sec === 'Dokumente') SecIcon = FileText;
                    if (sec === 'Historie') SecIcon = History;
                    if (sec === 'Konditionen') SecIcon = CreditCard;

                    return (
                      <motion.button
                        key={sec}
                        variants={tabVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        layout
                        onClick={() => setActiveTab(sec)}
                        className={`flex items-center gap-2.5 px-5 py-2.5 text-[13px] border-l-2 transition-colors duration-150 ${
                          isActive 
                            ? 'bg-[#2a2a2a] text-white border-[#E71F7F]' 
                            : 'text-gray-400 border-transparent hover:bg-[#202020] hover:text-gray-200'
                        }`}
                      >
                        <SecIcon size={16} />
                        {sec}
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Main Form Area */}
            <div className="flex-1 bg-[#121212] overflow-y-auto p-6 text-gray-100">
              
              {/* Top Configuration Area (Entity & Contact Types) */}
              <div className="mb-8 p-5 bg-[#1a1a1a] border border-[#333] rounded-lg">
                <div className="w-full flex flex-col lg:flex-row gap-8 lg:gap-12">
                  
                  {/* Entity Types (Radio) */}
                  <div>
                    <span className="block text-sm text-gray-400 mb-3">Welche Art von Kontakt legen Sie an?</span>
                    <div className="flex flex-wrap gap-3">
                      {entityTypesList.map(et => {
                        const isSelected = entityType === et.id;
                        return (
                          <button
                            key={et.id}
                            onClick={() => setEntityType(et.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] transition-colors border ${
                              isSelected 
                                ? 'bg-[#E71F7F]/10 border-[#E71F7F] text-[#E71F7F]' 
                                : 'bg-[#121212] border-[#444] text-gray-300 hover:border-gray-500'
                            }`}
                          >
                            <et.icon size={15} />
                            {et.id}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Contact Types (Checkboxes) */}
                  <div>
                    <span className="block text-sm text-gray-400 mb-3">Kontaktart wählen (Mehrfachauswahl möglich)</span>
                    <div className="flex flex-wrap gap-3">
                      {contactTypesList.map(type => {
                        const isSelected = contactTypes.includes(type);
                        return (
                          <label key={type} className="flex items-center gap-2 text-[13px] text-gray-300 cursor-pointer group">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              isSelected 
                                ? 'bg-[#E71F7F] border-[#E71F7F]' 
                                : 'bg-[#121212] border-[#555] group-hover:border-gray-400'
                            }`}>
                              {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={isSelected}
                              onChange={() => handleContactTypeChange(type)}
                            />
                            {type}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Tab Content Area */}
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6 pb-2 border-b border-[#333]">
                  <h2 className="text-lg font-medium text-white">{activeTab}</h2>
                </div>

                {activeTab === 'Stammdaten' && (
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl"
                  >
                    {/* Left Column */}
                    <div className="flex flex-col gap-6">
                      {/* Person Section */}
                      <div className="bg-[#1a1a1a] border border-[#333] p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-300 mb-4 border-b border-[#333] pb-2">Person</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                            <label className="text-[12px] text-gray-400 ml-1">Anrede</label>
                            <select 
                              value={formData.salutation}
                              onChange={(e) => updateField('salutation', e.target.value)}
                              className="bg-[#121212] border border-[#333] rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-[#E71F7F] transition-colors"
                            >
                              <option value="-">-</option>
                              <option value="Herr">Herr</option>
                              <option value="Frau">Frau</option>
                              <option value="Divers">Divers</option>
                            </select>
                          </motion.div>
                          <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                            <label className="text-[12px] text-gray-400 ml-1">Titel</label>
                            <input 
                              type="text" 
                              value={formData.title}
                              onChange={(e) => updateField('title', e.target.value)}
                              className="bg-[#121212] border border-[#333] rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#E71F7F] transition-colors"
                              placeholder="z.B. Dr."
                            />
                          </motion.div>
                          <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                            <label className="text-[12px] text-gray-400 ml-1">Vorname</label>
                            <input 
                              type="text" 
                              value={formData.vorname}
                              onChange={(e) => updateField('vorname', e.target.value)}
                              className="bg-[#121212] border border-[#333] rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#E71F7F] transition-colors"
                            />
                          </motion.div>
                          <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                            <label className="text-[12px] text-gray-400 ml-1">Nachname</label>
                            <input 
                              type="text" 
                              value={formData.nachname}
                              onChange={(e) => updateField('nachname', e.target.value)}
                              className="bg-[#121212] border border-[#333] rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#E71F7F] transition-colors"
                            />
                          </motion.div>
                          
                          <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                            <label className="text-[12px] text-gray-400 ml-1">Abteilung</label>
                            <input 
                              type="text" 
                              value={formData.abteilung}
                              onChange={(e) => updateField('abteilung', e.target.value)}
                              className="bg-[#121212] border border-[#333] rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#E71F7F] transition-colors"
                              placeholder="Abteilung"
                            />
                          </motion.div>
                          <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                            <label className="text-[12px] text-gray-400 ml-1">Position</label>
                            <input 
                              type="text" 
                              value={formData.position}
                              onChange={(e) => updateField('position', e.target.value)}
                              className="bg-[#121212] border border-[#333] rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#E71F7F] transition-colors"
                              placeholder="Position"
                            />
                          </motion.div>

                          <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                            <label className="text-[12px] text-gray-400 ml-1">Geburtstag</label>
                            <div className="relative">
                               <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                               <input 
                                 type="date" 
                                 value={formData.geburtstag}
                                 onChange={(e) => updateField('geburtstag', e.target.value)}
                                 className="w-full bg-[#121212] border border-[#333] rounded-md pl-9 pr-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#E71F7F] transition-colors appearance-none"
                               />
                            </div>
                          </motion.div>
                          <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                            <label className="text-[12px] text-gray-400 ml-1">Spitzname</label>
                            <input 
                              type="text" 
                              value={formData.spitzname}
                              onChange={(e) => updateField('spitzname', e.target.value)}
                              className="bg-[#121212] border border-[#333] rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#E71F7F] transition-colors"
                              placeholder="Spitzname"
                            />
                          </motion.div>

                          <motion.div variants={itemVariants} className="flex flex-col gap-1.5 col-span-2">
                            <label className="text-[12px] text-gray-400 ml-1">Briefliche Anrede</label>
                            <input 
                              type="text" 
                              value={formData.briefliche_anrede}
                              onChange={(e) => updateField('briefliche_anrede', e.target.value)}
                              className="bg-[#121212] border border-[#333] rounded-md px-3 py-4 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#E71F7F] transition-colors"
                            />
                          </motion.div>

                          <motion.div variants={itemVariants} className="flex flex-col gap-1.5 col-span-2">
                            <label className="text-[12px] text-gray-400 ml-1">Suchindex (Kontakte)</label>
                            <input 
                              type="text" 
                              value={formData.search_index}
                              onChange={(e) => updateField('search_index', e.target.value)}
                              className="bg-[#121212] border border-[#333] rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#E71F7F] transition-colors"
                              placeholder="Schlüsselworte wählen... (kommagetrennt)"
                            />
                          </motion.div>

                          {entityType !== 'Person' && (
                            <motion.div variants={itemVariants} className="flex flex-col gap-1.5 col-span-2">
                              <label className="text-[12px] text-gray-400 ml-1">Firmenname</label>
                              <input 
                                type="text" 
                                value={formData.firma}
                                onChange={(e) => updateField('firma', e.target.value)}
                                className="bg-[#121212] border border-[#333] rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#E71F7F] transition-colors"
                                placeholder="Firma GmbH"
                              />
                            </motion.div>
                          )}
                        </div>
                      </div>

                      {/* Adressen Section */}
                      <div className="bg-[#1a1a1a] border border-[#333] p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-4 border-b border-[#333] pb-2">
                          <h3 className="text-sm font-medium text-gray-300">Adressen</h3>
                          <button 
                            onClick={() => setAddresses([...addresses, { type: 'Rechnungsanschrift', adresszusatz: '', street: '', zip: '', city: '', country: 'Deutschland' }])}
                            className="flex items-center gap-1 text-[11px] bg-[#333] hover:bg-[#444] text-white px-2 py-1 rounded transition-colors"
                          >
                            <Plus size={12} /> Adresse
                          </button>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                          {addresses.map((addr, idx) => (
                            <div key={idx} className="flex flex-col gap-2 p-3 bg-[#121212] border border-[#333] rounded-md relative group">
                              <select 
                                value={addr.type}
                                onChange={(e) => {
                                  const newArr = [...addresses];
                                  newArr[idx].type = e.target.value;
                                  setAddresses(newArr);
                                }}
                                className="bg-[#1a1a1a] border border-[#333] rounded-md px-3 py-1.5 text-[13px] text-gray-100 focus:outline-none focus:border-[#E71F7F] transition-colors"
                              >
                                <option value="Rechnungsanschrift">Rechnungsanschrift</option>
                                <option value="Lieferanschrift">Lieferanschrift</option>
                                <option value="Postanschrift">Postanschrift</option>
                                <option value="Privatanschrift">Privatanschrift</option>
                              </select>
                              
                              <input 
                                type="text" 
                                value={addr.adresszusatz}
                                onChange={(e) => {
                                  const newArr = [...addresses];
                                  newArr[idx].adresszusatz = e.target.value;
                                  setAddresses(newArr);
                                }}
                                className="bg-[#1a1a1a] border border-[#333] rounded-md px-3 py-1.5 text-[13px] text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#E71F7F] transition-colors"
                                placeholder="Adresszusatz"
                              />

                              <input 
                                type="text" 
                                value={addr.street}
                                onChange={(e) => {
                                  const newArr = [...addresses];
                                  newArr[idx].street = e.target.value;
                                  setAddresses(newArr);
                                }}
                                className="bg-[#1a1a1a] border border-[#333] rounded-md px-3 py-1.5 text-[13px] text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#E71F7F] transition-colors"
                                placeholder="Straße o. Postfach"
                              />

                              <div className="grid grid-cols-[100px_1fr] gap-2">
                                <input 
                                  type="text" 
                                  value={addr.zip}
                                  onChange={(e) => {
                                    const newArr = [...addresses];
                                    newArr[idx].zip = e.target.value;
                                    setAddresses(newArr);
                                  }}
                                  className="bg-[#1a1a1a] border border-[#333] rounded-md px-3 py-1.5 text-[13px] text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#E71F7F] transition-colors"
                                  placeholder="PLZ"
                                />
                                <input 
                                  type="text" 
                                  value={addr.city}
                                  onChange={(e) => {
                                    const newArr = [...addresses];
                                    newArr[idx].city = e.target.value;
                                    setAddresses(newArr);
                                  }}
                                  className="bg-[#1a1a1a] border border-[#333] rounded-md px-3 py-1.5 text-[13px] text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#E71F7F] transition-colors"
                                  placeholder="Stadt"
                                />
                              </div>

                              <select 
                                value={addr.country || 'Deutschland'}
                                onChange={(e) => {
                                  const newArr = [...addresses];
                                  newArr[idx].country = e.target.value;
                                  setAddresses(newArr);
                                }}
                                className="bg-[#1a1a1a] border border-[#333] rounded-md px-3 py-1.5 text-[13px] text-gray-100 focus:outline-none focus:border-[#E71F7F] transition-colors"
                              >
                                <option value="Deutschland">Deutschland</option>
                                <option value="Österreich">Österreich</option>
                                <option value="Schweiz">Schweiz</option>
                              </select>

                              <button 
                                onClick={() => setAddresses(addresses.filter((_, i) => i !== idx))}
                                className="absolute -bottom-2 -right-2 text-gray-500 hover:text-red-500 bg-[#121212] rounded-full p-1 border border-[#333]"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                          {addresses.length === 0 && (
                            <p className="text-xs text-gray-500 italic">Keine Adressen hinterlegt.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col gap-6">
                      {/* Bilder/Notizen Section */}
                      <div className="bg-[#1a1a1a] border border-[#333] p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-300 mb-4 border-b border-[#333] pb-2">Bilder / Notizen</h3>
                        <div className="flex gap-4">
                          <motion.div variants={itemVariants} className="flex-1 flex flex-col gap-1.5">
                            <label className="text-[12px] text-gray-400 ml-1">Notieren Sie sich hier wichtige Informationen zu diesem Kontakt.</label>
                            <textarea 
                              rows={5}
                              value={formData.notizen}
                              onChange={(e) => updateField('notizen', e.target.value)}
                              className="bg-[#121212] h-full border border-[#333] rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#E71F7F] transition-colors resize-none"
                            />
                          </motion.div>
                          <div className="w-[120px] shrink-0 flex flex-col gap-2 items-center">
                            <div className="w-full aspect-square bg-[#121212] border border-[#333] rounded flex items-center justify-center text-gray-500">
                              <ImageIcon size={40} className="opacity-50" />
                            </div>
                            <button className="text-[11px] bg-[#333] hover:bg-[#444] text-white px-3 py-1.5 rounded transition-colors w-full">
                              Bild hochladen
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Kommunikation Section */}
                      <div className="bg-[#1a1a1a] border border-[#333] p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-4 border-b border-[#333] pb-2">
                          <h3 className="text-sm font-medium text-gray-300">Kommunikation</h3>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <label className="text-[11px] text-gray-400">Sprache:</label>
                              <select 
                                value={primaryLanguage}
                                onChange={(e) => setPrimaryLanguage(e.target.value)}
                                className="bg-[#121212] border border-[#333] rounded text-[11px] px-2 py-1 text-gray-200"
                              >
                                <option value="deutsch">deutsch</option>
                                <option value="englisch">englisch</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <button 
                            onClick={() => setCommunications([...communications, { type: 'Telefon', value: '' }])}
                            className="flex items-center gap-1 text-[11px] bg-[#333] hover:bg-[#444] text-white px-2 py-1 rounded transition-colors"
                          >
                            <Plus size={12} /> Kommunikation
                          </button>
                        </div>

                        <div className="flex flex-col gap-2">
                          {communications.map((comm, idx) => (
                            <div key={idx} className="flex gap-2 items-center group">
                              <select 
                                value={comm.type}
                                onChange={(e) => {
                                  const newArr = [...communications];
                                  newArr[idx].type = e.target.value;
                                  setCommunications(newArr);
                                }}
                                className="w-[130px] bg-[#121212] border border-[#333] rounded-md px-2 py-1.5 text-[13px] text-gray-100 focus:outline-none focus:border-[#E71F7F] transition-colors"
                              >
                                <option value="Telefon">Telefon</option>
                                <option value="Mobil">Mobil</option>
                                <option value="E-Mail">E-Mail</option>
                                <option value="Website">Website</option>
                                <option value="LinkedIn">LinkedIn</option>
                              </select>
                              
                              <input 
                                type="text" 
                                value={comm.value}
                                onChange={(e) => {
                                  const newArr = [...communications];
                                  newArr[idx].value = e.target.value;
                                  setCommunications(newArr);
                                }}
                                className="flex-1 bg-[#121212] border border-[#333] rounded-md px-3 py-1.5 text-[13px] text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#E71F7F] transition-colors"
                                placeholder="HIER"
                              />

                              <button 
                                onClick={() => setCommunications(communications.filter((_, i) => i !== idx))}
                                className="text-gray-500 hover:text-red-500 p-1 opacity-100"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          ))}
                          {communications.length === 0 && (
                            <p className="text-xs text-gray-500 italic mt-2">Keine Kommunikationsdaten hinterlegt.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'Mitarbeiterdaten' && (
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl"
                  >
                    <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                      <label className="text-[12px] text-gray-400 ml-1">Geburtstag</label>
                      <div className="relative">
                        <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input 
                          type="date" 
                          value={formData.geburtstag}
                          onChange={(e) => updateField('geburtstag', e.target.value)}
                          className="w-full bg-[#1a1a1a] border border-[#333] rounded-md pl-9 pr-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#E71F7F] transition-colors appearance-none"
                        />
                      </div>
                    </motion.div>
                    <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                      <label className="text-[12px] text-gray-400 ml-1">Aktuelle Klasse / Einstufung</label>
                      <select 
                        value={formData.klasse}
                        onChange={(e) => updateField('klasse', e.target.value)}
                        className="bg-[#1a1a1a] border border-[#333] rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-[#E71F7F] transition-colors appearance-none"
                      >
                        <option value="">Bitte wählen...</option>
                        <option value="Aushilfe">Aushilfe</option>
                        <option value="Junior">Junior</option>
                        <option value="Senior">Senior</option>
                        <option value="Crew Chief">Crew Chief</option>
                        <option value="Techniker">Techniker</option>
                      </select>
                    </motion.div>
                  </motion.div>
                )}

                {activeTab === 'Konditionen' && (
                  <motion.div variants={containerVariants} initial="hidden" animate="visible">
                    <p className="text-sm text-gray-400 flex items-center gap-2">
                       <ShieldAlert size={16} className="text-yellow-500" />
                       Konditionen werden hier verwaltet (z.B. Stundenlöhne, Tagessätze, Rabatte).
                    </p>
                  </motion.div>
                )}

                {activeTab === 'Dokumente' && (
                  <motion.div variants={containerVariants} initial="hidden" animate="visible">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#333] rounded-xl py-16 bg-[#1a1a1a]/50">
                      <FileText size={32} className="text-gray-600 mb-3" />
                      <span className="text-sm text-gray-300">Dateien per Drag & Drop hierhin ziehen</span>
                      <span className="text-xs text-gray-500 mt-1">oder manuell hochladen</span>
                      <button className="mt-4 px-4 py-1.5 bg-[#222] border border-[#444] rounded-md text-xs hover:bg-[#333] transition-colors">
                        Dateien auswählen
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'Historie' && (
                  <motion.div variants={containerVariants} initial="hidden" animate="visible">
                    <p className="text-sm text-gray-400">
                      Sobald der Kontakt erstellt wurde, werden hier Änderungen und Aktivitäten protokolliert.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
