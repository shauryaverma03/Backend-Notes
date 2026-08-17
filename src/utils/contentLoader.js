import { parseMarkdown, parseInterviewQuestions } from './markdownParser.js';

// Eagerly import all Markdown files from the root directory using Vite's import.meta.glob
const rawMarkdownFiles = import.meta.glob('../../*.md', { query: '?raw', eager: true });

// Define category mappings and topic metadata
const topicMetadataMap = [
  { id: '00', title: 'Table of Contents & Overview', category: 'Overview', icon: 'BookOpen' },
  { id: '01', title: 'Node.js Fundamentals', category: 'Fundamentals', icon: 'Cpu' },
  { id: '02', title: 'Modules & npm', category: 'Fundamentals', icon: 'Package' },
  { id: '03', title: 'File System & Streams', category: 'Fundamentals', icon: 'FileText' },
  { id: '04', title: 'HTTP & Networking', category: 'Fundamentals', icon: 'Globe' },
  
  { id: '05', title: 'Express.js', category: 'Express & REST', icon: 'Server' },
  { id: '06', title: 'REST API Design', category: 'Express & REST', icon: 'Layers' },
  { id: '07', title: 'Middleware Deep Dive', category: 'Express & REST', icon: 'Filter' },
  
  { id: '08', title: 'MongoDB & Mongoose', category: 'Databases', icon: 'Database' },
  { id: '09', title: 'SQL & PostgreSQL', category: 'Databases', icon: 'Table' },
  
  { id: '10', title: 'Authentication & Authorization', category: 'Auth & Security', icon: 'Lock' },
  { id: '11', title: 'Cookies, Sessions & Tokens', category: 'Auth & Security', icon: 'Key' },
  { id: '12', title: 'Security Best Practices', category: 'Auth & Security', icon: 'ShieldCheck' },
  
  { id: '13', title: 'File Uploads & Storage', category: 'Advanced & Operations', icon: 'Upload' },
  { id: '14', title: 'Error Handling & Logging', category: 'Advanced & Operations', icon: 'AlertTriangle' },
  { id: '15', title: 'Environment & Configuration', category: 'Advanced & Operations', icon: 'Sliders' },
  { id: '16', title: 'Testing (Jest & Supertest)', category: 'Advanced & Operations', icon: 'CheckSquare' },
  { id: '17', title: 'WebSockets & Real-time', category: 'Advanced & Operations', icon: 'Zap' },
  { id: '18', title: 'Caching & Performance (Redis)', category: 'Advanced & Operations', icon: 'Activity' },
  { id: '19', title: 'Deployment & DevOps (Docker, PM2)', category: 'Advanced & Operations', icon: 'Cloud' },
  
  { id: '20', title: 'System Design Basics', category: 'System Design & Interview', icon: 'GitStructure' },
  { id: '21', title: '50+ Interview Questions & Prep', category: 'System Design & Interview', icon: 'HelpCircle' }
];

export function getAllTopics() {
  const topics = [];

  // Match each metadata item with imported raw markdown files
  topicMetadataMap.forEach((meta) => {
    let rawContent = '';

    // Search key in imported markdown files object
    for (const path in rawMarkdownFiles) {
      const fileName = path.split('/').pop() || '';
      if (fileName.startsWith(`${meta.id}-`) || (meta.id === '00' && fileName.startsWith('00-Table-of-Contents'))) {
        const fileObj = rawMarkdownFiles[path];
        if (typeof fileObj === 'string') {
          rawContent = fileObj;
        } else if (fileObj && typeof fileObj.default === 'string') {
          rawContent = fileObj.default;
        } else if (fileObj && fileObj.default) {
          rawContent = String(fileObj.default);
        }
        break;
      }
    }

    const parsed = parseMarkdown(rawContent);

    topics.push({
      ...meta,
      rawContent,
      html: parsed.html,
      headings: parsed.headings,
      readTime: parsed.readTime,
      wordCount: parsed.wordCount
    });
  });

  return topics;
}

export function getInterviewQuestions() {
  const topic21 = getAllTopics().find(t => t.id === '21');
  if (!topic21) return [];
  return parseInterviewQuestions(topic21.rawContent);
}
