import React, { useState, useEffect } from 'react';
import { Search, X, BookOpen, ChevronRight } from 'lucide-react';

export default function GlobalSearchModal({
  isOpen,
  onClose,
  topics,
  interviewQuestions,
  onSelectTopic,
  onSelectInterview
}) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Trigger open
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const searchQuery = query.trim().toLowerCase();

  // Search through topics
  const topicResults = searchQuery
    ? topics.filter((t) => {
        return (
          t.title.toLowerCase().includes(searchQuery) ||
          t.category.toLowerCase().includes(searchQuery) ||
          t.rawContent.toLowerCase().includes(searchQuery)
        );
      }).map((t) => {
        // Extract snippet context if possible
        const idx = t.rawContent.toLowerCase().indexOf(searchQuery);
        let snippet = '';
        if (idx !== -1) {
          const start = Math.max(0, idx - 40);
          const end = Math.min(t.rawContent.length, idx + 80);
          snippet = '...' + t.rawContent.substring(start, end).replace(/\n/g, ' ') + '...';
        }
        return { ...t, snippet };
      })
    : [];

  // Search through interview questions
  const interviewResults = searchQuery
    ? interviewQuestions.filter((q) => {
        return (
          q.question.toLowerCase().includes(searchQuery) ||
          q.answerHtml.toLowerCase().includes(searchQuery)
        );
      })
    : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-wrapper">
          <Search size={20} color="var(--text-secondary)" />
          <input
            type="text"
            className="search-input"
            placeholder="Search all backend topics, interview Qs, or code concepts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button className="icon-btn" onClick={onClose} style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        <div className="search-results">
          {!searchQuery ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Type a keyword like <code style={{ color: 'var(--accent-cyan)' }}>Event Loop</code>, <code style={{ color: 'var(--accent-cyan)' }}>JWT</code>, <code style={{ color: 'var(--accent-cyan)' }}>Aggregation</code>, or <code style={{ color: 'var(--accent-cyan)' }}>CORS</code>...
            </div>
          ) : topicResults.length === 0 && interviewResults.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No matching backend topics or questions found for "{query}".
            </div>
          ) : (
            <>
              {topicResults.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>
                    Guides & Topics ({topicResults.length})
                  </div>
                  {topicResults.slice(0, 8).map((topic) => (
                    <div
                      key={topic.id}
                      className="search-result-item"
                      onClick={() => {
                        onSelectTopic(topic.id);
                        onClose();
                      }}
                    >
                      <div className="search-result-topic">Module {topic.id} &bull; {topic.category}</div>
                      <div className="search-result-title">{topic.title}</div>
                      {topic.snippet && <div className="search-result-snippet">{topic.snippet}</div>}
                    </div>
                  ))}
                </div>
              )}

              {interviewResults.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>
                    Interview Questions ({interviewResults.length})
                  </div>
                  {interviewResults.slice(0, 6).map((q) => (
                    <div
                      key={q.id}
                      className="search-result-item"
                      onClick={() => {
                        onSelectInterview(q.id);
                        onClose();
                      }}
                    >
                      <div className="search-result-topic">Interview Q{q.id} &bull; {q.category}</div>
                      <div className="search-result-title">{q.question}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
