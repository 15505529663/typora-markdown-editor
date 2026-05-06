import { EditorView } from '@codemirror/view';
import { 
  CODE_LANGUAGES as CODE_BLOCK_LANGUAGES,
  getLanguageLabel,
  normalizeCodeLanguage,
} from './codeLanguages';

/**
 * 打开语言选择菜单
 */
export function openLanguageMenu(
  view: EditorView, 
  anchor: HTMLElement, 
  fenceFrom: number, 
  fenceTo: number, 
  currentLanguage: string
) {
  // 移除现有的菜单
  document.querySelectorAll('.cm-code-language-menu, .cm-code-insert-language-menu').forEach(el => el.remove());

  const menu = document.createElement('div');
  menu.className = 'cm-code-language-menu';
  
  // 计算位置
  const rect = anchor.getBoundingClientRect();
  menu.style.top = `${rect.bottom + 5}px`;
  menu.style.right = `${window.innerWidth - rect.right}px`;

  // 添加搜索/过滤输入框 (可选，Typora 有这个)
  const input = document.createElement('input');
  input.className = 'cm-code-insert-language-input';
  input.placeholder = '查找语言...';
  input.style.gridColumn = '1 / -1';
  input.style.marginBottom = '4px';
  menu.appendChild(input);

  const listContainer = document.createElement('div');
  listContainer.style.display = 'contents';
  menu.appendChild(listContainer);

  const renderLanguages = (filter: string = '') => {
    listContainer.innerHTML = '';
    const filtered = CODE_BLOCK_LANGUAGES.filter(lang => 
      lang.toLowerCase().includes(filter.toLowerCase()) || 
      getLanguageLabel(lang).toLowerCase().includes(filter.toLowerCase())
    );

    filtered.forEach(lang => {
      const item = document.createElement('button');
      item.className = `cm-code-language-menu-item ${normalizeCodeLanguage(lang) === normalizeCodeLanguage(currentLanguage) ? 'is-active' : ''}`;
      item.textContent = getLanguageLabel(lang);
      item.onclick = () => {
        updateCodeBlockLanguage(view, fenceFrom, lang);
        menu.remove();
      };
      listContainer.appendChild(item);
    });
  };

  input.oninput = (e) => {
    renderLanguages((e.target as HTMLInputElement).value);
  };

  renderLanguages();
  document.body.appendChild(menu);

  // 点击外部关闭
  const handleClickOutside = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node) && !anchor.contains(e.target as Node)) {
      menu.remove();
      document.removeEventListener('mousedown', handleClickOutside);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
}

/**
 * 更新代码块语言
 */
function updateCodeBlockLanguage(view: EditorView, fenceFrom: number, newLanguage: string) {
  const line = view.state.doc.lineAt(fenceFrom);
  const text = line.text;
  const match = text.match(/^(\s*)```([^\s`]*)?/);
  
  if (match) {
    const indent = match[1];
    const newText = `${indent}\`\`\`${newLanguage}`;
    view.dispatch({
      changes: {
        from: line.from,
        to: line.to,
        insert: newText
      }
    });
  }
}

export {
  CODE_BLOCK_LANGUAGES,
  getLanguageLabel,
  normalizeCodeLanguage,
};
