import hljs from 'highlight.js/lib/core';
import type { LanguageFn } from 'highlight.js';
import bash from 'highlight.js/lib/languages/bash';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import css from 'highlight.js/lib/languages/css';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import kotlin from 'highlight.js/lib/languages/kotlin';
import markdown from 'highlight.js/lib/languages/markdown';
import php from 'highlight.js/lib/languages/php';
import plaintext from 'highlight.js/lib/languages/plaintext';
import python from 'highlight.js/lib/languages/python';
import ruby from 'highlight.js/lib/languages/ruby';
import rust from 'highlight.js/lib/languages/rust';
import sql from 'highlight.js/lib/languages/sql';
import swift from 'highlight.js/lib/languages/swift';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';

export const CODE_LANGUAGES = [
  'text',
  'plaintext',
  'java',
  'python',
  'javascript',
  'typescript',
  'html',
  'css',
  'json',
  'bash',
  'shell',
  'sql',
  'cpp',
  'c',
  'csharp',
  'go',
  'rust',
  'php',
  'ruby',
  'kotlin',
  'swift',
  'markdown',
  'yaml',
  'xml',
  'dockerfile',
];

const LANGUAGE_ALIASES: Record<string, string> = {
  plain: 'plaintext',
  text: 'plaintext',
  txt: 'plaintext',
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  md: 'markdown',
  'c++': 'cpp',
  cc: 'cpp',
  hpp: 'cpp',
  cs: 'csharp',
  html: 'xml', // hljs uses xml for html
};

const LANGUAGE_LABELS: Record<string, string> = {
  plaintext: 'text',
  bash: 'bash',
  csharp: 'csharp',
  xml: 'html',
};

const registeredLanguages = new Set<string>();

const languageLoaders: Record<string, LanguageFn> = {
  plaintext,
  java,
  python,
  javascript,
  typescript,
  xml,
  css,
  json,
  bash,
  sql,
  cpp,
  c,
  csharp,
  go,
  rust,
  php,
  ruby,
  kotlin,
  swift,
  markdown,
  yaml,
  dockerfile,
};

export function normalizeCodeLanguage(language: string | null | undefined): string {
  const raw = (language || 'text').trim().toLowerCase().replace(/[^a-z0-9_+#.-]/g, '');
  const normalized = raw || 'text';
  return LANGUAGE_ALIASES[normalized] || normalized;
}

export function getLanguageLabel(language: string | null | undefined): string {
  const normalized = normalizeCodeLanguage(language);
  const target = isSupportedHighlightLanguage(normalized) ? normalized : 'text';
  return LANGUAGE_LABELS[target] || target;
}

export function isSupportedHighlightLanguage(language: string | null | undefined): boolean {
  const normalized = normalizeCodeLanguage(language);
  return normalized === 'plaintext' || Boolean(languageLoaders[normalized]);
}

export function ensureHighlightLanguage(language: string | null | undefined): string {
  const normalized = normalizeCodeLanguage(language);
  const target = isSupportedHighlightLanguage(normalized) ? normalized : 'plaintext';

  if (!registeredLanguages.has(target)) {
    const loader = languageLoaders[target];
    if (loader) {
      hljs.registerLanguage(target, loader);
      registeredLanguages.add(target);
    }
  }

  return target;
}

export { hljs };
