import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Eye, EyeOff, CheckCircle, HelpCircle } from 'lucide-react';

export default function InterviewPrep({ questions }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [masteredIds, setMasteredIds] = useState([]);
  const [revealAll, setRevealAll] = useState(false);

  const categories = ['All', ...Array.from(new Set(questions.map(q => q.category)))];

  const filteredQuestions = selectedCategory === 'All'
    ? questions
    : questions.filter(q => q.category === selectedCategory);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleMastered = (id, e) => {
    e.stopPropagation();
    if (masteredIds.includes(id)) {
      setMasteredIds(masteredIds.filter(item => item !== id));
    } else {
      setMasteredIds([...masteredIds, id]);
    }
  };

  return (
    <main className="reader-container">
      <header className="reader-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Sparkles color="var(--accent-primary)" size={24} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Interactive Practice Portal
          </span>
        </div>

        <h1 className="reader-title">Top 50+ Backend Interview Questions</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Test your conceptual understanding of Node.js, Express, databases, authentication, security, and system design.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="interview-filters">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="filter-chip"
              onClick={() => setRevealAll(!revealAll)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {revealAll ? <EyeOff size={15} /> : <Eye size={15} />}
              <span>{revealAll ? 'Hide All Answers' : 'Reveal All Answers'}</span>
            </button>
          </div>
        </div>
      </header>

      <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Showing {filteredQuestions.length} questions &bull; {masteredIds.length} mastered
      </div>

      <div className="interview-container">
        {filteredQuestions.map((q) => {
          const isExpanded = revealAll || expandedId === q.id;
          const isMastered = masteredIds.includes(q.id);

          return (
            <div key={q.id} className="qa-card">
              <div className="qa-header" onClick={() => toggleExpand(q.id)}>
                <div className="qa-question">
                  <span className="qa-num">Q{q.id}.</span>
                  <span>{q.question}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    className="icon-btn"
                    onClick={(e) => toggleMastered(q.id, e)}
                    title={isMastered ? 'Mark as unmastered' : 'Mark as mastered'}
                    style={{ width: '32px', height: '32px' }}
                  >
                    <CheckCircle size={16} color={isMastered ? 'var(--accent-emerald)' : 'var(--text-muted)'} />
                  </button>

                  <div style={{ color: 'var(--text-muted)' }}>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div
                  className="qa-answer markdown-body"
                  dangerouslySetInnerHTML={{ __html: q.answerHtml }}
                />
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
