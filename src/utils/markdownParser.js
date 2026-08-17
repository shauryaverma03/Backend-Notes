import { marked } from 'marked';
import hljs from 'highlight.js';

// Configure marked with highlight.js
marked.setOptions({
  highlight: function (code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  gfm: true,
  breaks: true
});

/**
 * Parses raw Markdown text into HTML and extracts metadata (headings, reading time).
 */
export function parseMarkdown(content) {
  if (!content) return { html: '', headings: [], wordCount: 0, readTime: '1 min' };

  // Calculate word count & estimated reading time
  const cleanText = content.replace(/```[\s\S]*?```/g, '').replace(/[#*`_~]/g, '');
  const wordCount = cleanText.trim().split(/\s+/).filter(Boolean).length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
  const readTime = `${readTimeMinutes} min read`;

  // Extract H1, H2, H3 headings for in-page TOC
  const headings = [];
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();
    const id = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    headings.push({ level, title, id });
  }

  // Custom renderer to add IDs to headings
  const renderer = new marked.Renderer();
  renderer.heading = (text, level) => {
    const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    return `<h${level} id="${id}">${text}</h${level}>`;
  };

  const html = marked.parse(content, { renderer });

  return {
    html,
    headings,
    wordCount,
    readTime
  };
}

/**
 * Specialized parser for 21-Interview-Questions.md
 * Extracts Q&A pairs with numbers, questions, and answers.
 */
export function parseInterviewQuestions(rawMarkdown) {
  if (!rawMarkdown) return [];

  const questions = [];
  let currentCategory = 'Node.js Core';

  // Split by markdown headings H2 or H3
  const lines = rawMarkdown.split('\n');
  let currentQuestion = null;
  let currentAnswerLines = [];

  const saveCurrentQuestion = () => {
    if (currentQuestion) {
      const answerMarkdown = currentAnswerLines.join('\n').trim();
      const parsedAnswer = parseMarkdown(answerMarkdown).html;
      questions.push({
        id: currentQuestion.id,
        question: currentQuestion.text,
        answerHtml: parsedAnswer,
        category: currentCategory
      });
      currentQuestion = null;
      currentAnswerLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect H2 Section Category e.g. "## Node.js Core", "## Express.js", "## Databases"
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      saveCurrentQuestion();
      const catTitle = h2Match[1].trim();
      if (catTitle.toLowerCase().includes('express')) currentCategory = 'Express.js';
      else if (catTitle.toLowerCase().includes('database') || catTitle.toLowerCase().includes('sql')) currentCategory = 'Databases';
      else if (catTitle.toLowerCase().includes('auth') || catTitle.toLowerCase().includes('security')) currentCategory = 'Security & Auth';
      else if (catTitle.toLowerCase().includes('performance') || catTitle.toLowerCase().includes('scaling') || catTitle.toLowerCase().includes('system')) currentCategory = 'System Design & Perf';
      else if (catTitle.toLowerCase().includes('node')) currentCategory = 'Node.js Core';
      else currentCategory = catTitle;
      continue;
    }

    // Detect H3 Question e.g. "### Q1: What is Node.js?" or "### 1. What is Node.js?"
    const h3Match = line.match(/^###\s+Q?(\d+)[\.\:]\s+(.+)$/i);
    if (h3Match) {
      saveCurrentQuestion();
      currentQuestion = {
        id: parseInt(h3Match[1], 10),
        text: h3Match[2].trim()
      };
      continue;
    }

    if (currentQuestion) {
      currentAnswerLines.push(line);
    }
  }

  saveCurrentQuestion();
  return questions;
}
