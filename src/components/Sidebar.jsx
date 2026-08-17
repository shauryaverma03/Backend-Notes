import React from 'react';
import { CheckCircle2, Circle, Sparkles, BookOpen, Layers, Database, ShieldCheck, Cpu, GitBranch } from 'lucide-react';

export default function Sidebar({
  topics,
  activeTopicId,
  onSelectTopic,
  completedTopicIds,
  onToggleComplete,
  isOpen,
  activeView,
  setActiveView
}) {
  // Group topics by category
  const categories = Array.from(new Set(topics.map(t => t.category)));

  const categoryIconMap = {
    'Overview': BookOpen,
    'Fundamentals': Cpu,
    'Express & REST': Layers,
    'Databases': Database,
    'Auth & Security': ShieldCheck,
    'Advanced & Operations': GitBranch,
    'System Design & Interview': Sparkles
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          className={`nav-item ${activeView === 'interview' ? 'active' : ''}`}
          onClick={() => setActiveView('interview')}
          style={{ width: '100%', marginBottom: '1rem', background: activeView === 'interview' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)' }}
        >
          <Sparkles size={18} color="var(--accent-primary)" />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>50+ Interview Flashcards</span>
        </button>
      </div>

      {categories.map((category) => {
        const CategoryIcon = categoryIconMap[category] || BookOpen;
        const categoryTopics = topics.filter(t => t.category === category);

        return (
          <div key={category} className="sidebar-category">
            <div className="category-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CategoryIcon size={14} color="var(--text-muted)" />
                <span>{category}</span>
              </div>
              <span>{categoryTopics.length}</span>
            </div>

            {categoryTopics.map((topic) => {
              const isCompleted = completedTopicIds.includes(topic.id);
              const isActive = activeView === 'reader' && activeTopicId === topic.id;

              return (
                <div
                  key={topic.id}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setActiveView('reader');
                    onSelectTopic(topic.id);
                  }}
                >
                  <span className="topic-num">{topic.id}</span>
                  <span className="topic-title">{topic.title}</span>

                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleComplete(topic.id);
                    }}
                    title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={16} color="var(--accent-emerald)" />
                    ) : (
                      <Circle size={16} color="var(--text-muted)" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}
    </aside>
  );
}
