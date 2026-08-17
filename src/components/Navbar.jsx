import React from 'react';
import { Search, Moon, Sun, Menu, X, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';

export default function Navbar({
  currentTheme,
  onToggleTheme,
  onOpenSearch,
  onToggleSidebar,
  isSidebarOpen,
  completedCount,
  totalCount,
  activeView,
  setActiveView
}) {
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          className="icon-btn mobile-only"
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
          style={{ display: 'none' }}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="navbar-brand" onClick={() => setActiveView('reader')}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <BookOpen size={20} />
          </div>
          <span>Backend Mastery</span>
          <span className="brand-badge">Guide</span>
        </div>
      </div>

      <div className="navbar-center">
        <button className="search-trigger" onClick={onOpenSearch}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={16} />
            <span>Search backend concepts...</span>
          </div>
          <span className="search-shortcut">⌘K</span>
        </button>
      </div>

      <div className="navbar-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginRight: '0.5rem' }}>
          <button
            className={`filter-chip ${activeView === 'reader' ? 'active' : ''}`}
            onClick={() => setActiveView('reader')}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
          >
            Guide
          </button>
          <button
            className={`filter-chip ${activeView === 'interview' ? 'active' : ''}`}
            onClick={() => setActiveView('interview')}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Sparkles size={14} /> Flashcards
          </button>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.3rem 0.75rem',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-color)',
          fontSize: '0.8rem'
        }}>
          <CheckCircle2 size={15} color="var(--accent-emerald)" />
          <span style={{ color: 'var(--text-secondary)' }}>
            <strong>{completedCount}</strong>/{totalCount}
          </span>
          <div style={{
            width: '45px',
            height: '6px',
            background: 'var(--bg-tertiary)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10b981, #06b6d4)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        <button className="icon-btn" onClick={onToggleTheme} aria-label="Toggle theme">
          {currentTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
