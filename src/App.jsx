import React, { useState, useEffect } from 'react';
import { getAllTopics, getInterviewQuestions } from './utils/contentLoader';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import TopicViewer from './components/TopicViewer';
import InterviewPrep from './components/InterviewPrep';
import GlobalSearchModal from './components/GlobalSearchModal';

export default function App() {
  const [topics, setTopics] = useState([]);
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [activeTopicId, setActiveTopicId] = useState('00');
  const [activeView, setActiveView] = useState('reader'); // 'reader' or 'interview'

  // LocalStorage state persistence
  const [completedTopicIds, setCompletedTopicIds] = useState(() => {
    try {
      const saved = localStorage.getItem('backend_guide_completed');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('backend_guide_theme') || 'dark';
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initialize topics & interview questions
  useEffect(() => {
    const loadedTopics = getAllTopics();
    setTopics(loadedTopics);
    setInterviewQuestions(getInterviewQuestions());
  }, []);

  // Theme attribute management
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('backend_guide_theme', theme);
  }, [theme]);

  // Persist completion state
  useEffect(() => {
    localStorage.setItem('backend_guide_completed', JSON.stringify(completedTopicIds));
  }, [completedTopicIds]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleTopicComplete = (id) => {
    setCompletedTopicIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const currentTopic = topics.find(t => t.id === activeTopicId) || topics[0];
  const currentIndex = topics.findIndex(t => t.id === activeTopicId);
  const prevTopic = currentIndex > 0 ? topics[currentIndex - 1] : null;
  const nextTopic = currentIndex !== -1 && currentIndex < topics.length - 1 ? topics[currentIndex + 1] : null;

  return (
    <div className="app-container">
      <Navbar
        currentTheme={theme}
        onToggleTheme={toggleTheme}
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        completedCount={completedTopicIds.length}
        totalCount={topics.length}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      <div className="main-content-wrapper">
        <Sidebar
          topics={topics}
          activeTopicId={activeTopicId}
          onSelectTopic={(id) => {
            setActiveTopicId(id);
            setIsSidebarOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          completedTopicIds={completedTopicIds}
          onToggleComplete={toggleTopicComplete}
          isOpen={isSidebarOpen}
          activeView={activeView}
          setActiveView={setActiveView}
        />

        {activeView === 'reader' ? (
          <TopicViewer
            topic={currentTopic}
            prevTopic={prevTopic}
            nextTopic={nextTopic}
            onSelectTopic={(id) => {
              setActiveTopicId(id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            isCompleted={completedTopicIds.includes(activeTopicId)}
            onToggleComplete={toggleTopicComplete}
          />
        ) : (
          <InterviewPrep questions={interviewQuestions} />
        )}
      </div>

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        topics={topics}
        interviewQuestions={interviewQuestions}
        onSelectTopic={(id) => {
          setActiveView('reader');
          setActiveTopicId(id);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectInterview={(qId) => {
          setActiveView('interview');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
