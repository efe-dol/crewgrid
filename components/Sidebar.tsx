'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MENU_DATA = [
  {
    id: 'office',
    label: 'Office',
    items: [
      { href: '/crewgrid/home', icon: 'ti-layout-dashboard', label: 'Dashboard' },
      { href: '#', icon: 'ti-calendar', label: 'Kalender' },
      { href: '#', icon: 'ti-eye', label: 'Überblick' },
      { href: '#', icon: 'ti-layout-kanban', label: 'Dispoboard' },
      { href: '#', icon: 'ti-check', label: 'Aufgaben' },
      { href: '/crewgrid/employees', icon: 'ti-users', label: 'Mitarbeiter' },
      { href: '#', icon: 'ti-mail', label: 'Briefe' },
    ]
  },
  {
    id: 'stammdaten',
    label: 'Stammdaten',
    items: [
      { href: '#', icon: 'ti-address-book', label: 'Kontakte' },
      { href: '#', icon: 'ti-users-group', label: 'Kunden' },
      { href: '#', icon: 'ti-id-badge', label: 'Personal' },
      { href: '#', icon: 'ti-list-check', label: 'Leistungen' },
      { href: '#', icon: 'ti-package', label: 'Artikel' },
      { href: '#', icon: 'ti-box', label: 'Inventar' },
      { href: '#', icon: 'ti-map-pin', label: 'Locations' },
    ]
  },
  {
    id: 'jobs',
    label: 'Jobs',
    items: [
      { href: '#', icon: 'ti-inbox', label: 'Anfragen' },
      { href: '#', icon: 'ti-file-invoice', label: 'Angebote' },
      { href: '#', icon: 'ti-briefcase', label: 'Aufträge' },
      { href: '#', icon: 'ti-truck-delivery', label: 'Lieferscheine' },
    ]
  },
  {
    id: 'zumietung',
    label: 'Zumietung/Einkauf',
    items: [
      { href: '#', icon: 'ti-handshake', label: 'Partner' },
      { href: '#', icon: 'ti-building-warehouse', label: 'Anmietungen' },
      { href: '#', icon: 'ti-shopping-cart', label: 'Einkauf' },
    ]
  },
  {
    id: 'lager',
    label: 'Lager',
    items: [
      { href: '#', icon: 'ti-tool', label: 'Prüfungen/Service' },
      { href: '#', icon: 'ti-package-export', label: 'Warenausgang' },
      { href: '#', icon: 'ti-package-import', label: 'Wareneingang' },
      { href: '#', icon: 'ti-archive', label: 'Casing' },
      { href: '#', icon: 'ti-package-off', label: 'Fehlmengen' },
      { href: '#', icon: 'ti-clipboard-list', label: 'Inventur' },
    ]
  },
  {
    id: 'finanzen',
    label: 'Finanzen',
    items: [
      { href: '#', icon: 'ti-chart-pie', label: 'Buget' },
      { href: '#', icon: 'ti-receipt', label: 'Buchhaltung' },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expandedSection, setExpandedSection] = useState<string | null>('office');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Optional: Auto-expand section containing the current active path
  useEffect(() => {
    const activeSection = MENU_DATA.find(section => 
      section.items.some(item => item.href !== '#' && pathname.startsWith(item.href))
    );
    if (activeSection) {
      setExpandedSection(activeSection.id);
    }
  }, [pathname]);

  const toggleSection = (id: string) => {
    setExpandedSection(prev => (prev === id ? null : id));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .sidebar-component {
          width: 220px;
          background: #1a1a1a;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          animation: dashboard-sidebar-in 620ms cubic-bezier(0.16, 1, 0.3, 1) 60ms both;
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sidebar-component.collapsed {
          width: 46px;
        }

        /* Custom scrollbar for sidebar */
        .sidebar-component::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-component::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        
        .logo { padding: 16px 20px; border-bottom: 0.5px solid #333; display: flex; align-items: center; gap: 10px; flex-shrink: 0; white-space: nowrap; }
        .sidebar-component.collapsed .logo { padding: 16px 0; justify-content: center; border-bottom: transparent; }
        .sidebar-component.collapsed .logo span { display: none; }
        .logo span { color: #E71F7F; font-weight: 600; font-size: 16px; letter-spacing: .5px; }
        .logo i { color: #E71F7F; font-size: 20px; }
        
        .funktionen-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 20px;
          color: #E71F7F;
          font-weight: 500;
          font-size: 15px;
          cursor: pointer;
          border-bottom: 0.5px solid #333;
          margin-bottom: 4px;
          transition: background 0.15s, padding 0.3s;
          white-space: nowrap;
        }
        .funktionen-header:hover {
          background: #2a2a2a;
        }
        .funktionen-header i {
          font-size: 18px;
          flex-shrink: 0;
        }
        
        .sidebar-component.collapsed .funktionen-header {
          flex-direction: column;
          padding: 16px 0;
          gap: 16px;
          border-bottom: transparent;
        }
        .sidebar-component.collapsed .funktionen-text {
          writing-mode: vertical-rl;
          letter-spacing: 1px;
          display: inline-block;
        }
        
        .sidebar-component.collapsed {
          border-right: 0.5px solid #333;
        }
        
        .nav-container {
          display: block;
          opacity: 1;
          transition: opacity 0.2s;
        }
        .sidebar-component.collapsed .nav-container {
          display: none;
          opacity: 0;
        }

        .nav-section { padding: 4px 0; display: flex; flex-direction: column; }
        
        .nav-label { 
          font-size: 11px; 
          color: #666; 
          padding: 8px 20px; 
          text-transform: uppercase; 
          letter-spacing: .8px; 
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: color 0.2s;
          user-select: none;
        }
        .nav-label:hover {
          color: #999;
        }
        .nav-label-icon {
          font-size: 14px;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nav-label-icon.open {
          transform: rotate(180deg);
        }

        /* Smooth Accordion Magic with CSS Grid */
        .nav-items-wrapper {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nav-items-wrapper.expanded {
          grid-template-rows: 1fr;
        }
        .nav-items-content {
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .nav-item { 
          display: flex; 
          align-items: center; 
          gap: 10px; 
          padding: 8px 20px; 
          font-size: 13px; 
          color: #aaa; 
          cursor: pointer; 
          transition: background .15s, color .15s; 
          text-decoration: none;
        }
        .nav-item:hover { background: #2a2a2a; color: #ddd; }
        .nav-item.active { background: #2a2a2a; color: #fff; border-left: 2px solid #E71F7F; }
        .nav-item i { font-size: 16px; width: 18px; }
      ` }} />

      <div className={`sidebar-component ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="logo">
          <i className="ti ti-bolt" aria-hidden="true"></i>
          <span>Crewgrid</span>
        </div>
        
        <div style={{ padding: '0 0 8px 0' }}>
          <div className="funktionen-header" onClick={() => setIsCollapsed(!isCollapsed)}>
            <i className="ti ti-menu-2" aria-hidden="true"></i>
            <span className="funktionen-text">Funktionen</span>
          </div>

          <div className="nav-container">
            {MENU_DATA.map((section) => {
              const isExpanded = expandedSection === section.id;
              return (
              <div key={section.id} className="nav-section">
                <div className="nav-label" onClick={() => toggleSection(section.id)}>
                  <span>{section.label}</span>
                  <i className={`ti ti-chevron-down nav-label-icon ${isExpanded ? 'open' : ''}`} aria-hidden="true"></i>
                </div>
                
                <div className={`nav-items-wrapper ${isExpanded ? 'expanded' : ''}`}>
                  <div className="nav-items-content">
                    {section.items.map((item, index) => {
                      const isActive = item.href !== '#' && pathname === item.href;
                      if (item.href === '#') {
                        return (
                          <div 
                            key={index} 
                            className={`nav-item ${isActive ? 'active' : ''}`}
                            onClick={(e) => e.preventDefault()}
                          >
                            <i className={`ti ${item.icon}`} aria-hidden="true"></i> 
                            {item.label}
                          </div>
                        );
                      }

                      return (
                        <Link 
                          key={index} 
                          href={item.href} 
                          target="_self"
                          className={`nav-item ${isActive ? 'active' : ''}`}
                        >
                          <i className={`ti ${item.icon}`} aria-hidden="true"></i> 
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </>
  );
}
