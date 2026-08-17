import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Circle, Clock, FileText, ChevronRight, ChevronLeft, Copy, Check, List } from 'lucide-react';

export default function TopicViewer({
  topic,
  prevTopic,
  nextTopic,
  onSelectTopic,
  isCompleted,
  onToggleComplete
}) {
  const contentRef = useRef(null);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState(null);
  const [showToc, setShowToc] = useState(false);

  // Add copy buttons to rendered code blocks dynamically
  useEffect(() => {
    if (!contentRef.current) return;

    const pres = contentRef.current.querySelectorAll('pre');
    pres.forEach((pre, index) => {
      // Check if button already exists
      if (pre.querySelector('.copy-code-btn')) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-code-btn';
      copyBtn.innerHTML = `<span>Copy</span>`;
      
      copyBtn.addEventListener('click', () => {
        const codeText = pre.innerText;
        navigator.clipboard.writeText(codeText);
        copyBtn.innerHTML = `<span>Copied!</span>`;
        setTimeout(() => {
          copyBtn.innerHTML = `<span>Copy</span>`;
        }, 2000);
      });

      wrapper.appendChild(copyBtn);
    });
  }, [topic]);

  if (!topic) {
    return <div className="reader-container">Topic not found.</div>;
  }

  const scrollToHeading = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main className="reader-container">
      <header className="reader-header">
        <div className="reader-meta-row">
          <span className="topic-badge">
            Module {topic.id} &bull; {topic.category}
          </span>

          <div className="reader-actions">
            <button
              className={`btn-complete ${isCompleted ? 'completed' : ''}`}
              onClick={() => onToggleComplete(topic.id)}
            >
              {isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              <span>{isCompleted ? 'Completed' : 'Mark as Completed'}</span>
            </button>
          </div>
        </div>

        <h1 className="reader-title">{topic.title}</h1>

        <div className="reading-stats">
          <div className="stat-item">
            <Clock size={15} />
            <span>{topic.readTime}</span>
          </div>
          <div className="stat-item">
            <FileText size={15} />
            <span>{topic.wordCount} words</span>
          </div>
          {topic.headings.length > 0 && (
            <div style={{ position: 'relative', marginLeft: 'auto' }}>
              <button
                className="filter-chip"
                onClick={() => setShowToc(!showToc)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
              >
                <List size={14} /> Quick Headings ({topic.headings.length})
              </button>

              {showToc && (
                <div style={{
                  position: 'absolute',
                  top: '120%',
                  right: 0,
                  width: '280px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '0.75rem',
                  zIndex: 50,
                  maxHeight: '320px',
                  overflowY: 'auto'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    On This Page
                  </div>
                  {topic.headings.map((h, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        scrollToHeading(h.id);
                        setShowToc(false);
                      }}
                      style={{
                        padding: '0.35rem 0.5rem',
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        borderRadius: 'var(--radius-sm)',
                        paddingLeft: `${(h.level - 1) * 0.75 + 0.5}rem`,
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'var(--bg-tertiary)'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      {h.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Rendered HTML content */}
      <article
        ref={contentRef}
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: topic.html }}
      />

      {/* Footer Navigation */}
      <footer className="topic-nav-footer">
        {prevTopic ? (
          <button className="nav-btn prev" onClick={() => onSelectTopic(prevTopic.id)}>
            <ChevronLeft size={20} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Previous Topic</div>
              <div>{prevTopic.title}</div>
            </div>
          </button>
        ) : <div />}

        {nextTopic ? (
          <button className="nav-btn next" onClick={() => onSelectTopic(nextTopic.id)}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Next Topic</div>
              <div>{nextTopic.title}</div>
            </div>
            <ChevronRight size={20} />
          </button>
        ) : <div />}
      </footer>
    </main>
  );
}
