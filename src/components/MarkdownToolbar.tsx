import React from 'react';
import { editorCommands, CommandId } from '../lib/editorCommands';
import {
  Bold,
  CheckSquare,
  Code,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Italic,
  Link,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Sigma,
  Square,
  Strikethrough,
  Table,
  Text,
  Underline,
} from 'lucide-react';
import ImageInsertMenu from './ImageInsertMenu';

interface ToolbarButtonProps {
  onCommand: (id: CommandId) => void;
  command: CommandId;
  icon: React.ReactNode;
}

const commandTitle = (id: CommandId) => {
  const command = editorCommands.find((item) => item.id === id);
  if (!command) return id;
  return command.shortcut ? `${command.label} (${command.shortcut})` : command.label;
};

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onCommand, command, icon }) => (
  <button
    type="button"
    onMouseDown={(event) => {
      event.preventDefault();
      onCommand(command);
    }}
    className="toolbar-icon-button h-8 w-8 inline-flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400 flex-shrink-0"
    title={commandTitle(command)}
    aria-label={commandTitle(command)}
  >
    {icon}
  </button>
);

interface MarkdownToolbarProps {
  onCommand: (id: CommandId) => void;
  onChooseImageFile: (file: File) => void | Promise<void>;
  onInsertImageUrl: (url: string, altText: string) => void;
}

const groupClass = 'toolbar-group flex items-center gap-0.5 border-r border-gray-300 dark:border-gray-600 pr-1 mr-1';

const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({ onCommand, onChooseImageFile, onInsertImageUrl }) => {
  return (
    <div className="markdown-toolbar flex items-center gap-0.5 p-1 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto no-scrollbar select-none">
      <div className={groupClass}>
        <ToolbarButton onCommand={onCommand} command="paragraph" icon={<Text size={18} />} />
        <ToolbarButton onCommand={onCommand} command="h1" icon={<Heading1 size={18} />} />
        <ToolbarButton onCommand={onCommand} command="h2" icon={<Heading2 size={18} />} />
        <ToolbarButton onCommand={onCommand} command="h3" icon={<Heading3 size={18} />} />
        <ToolbarButton onCommand={onCommand} command="h4" icon={<Heading4 size={18} />} />
        <ToolbarButton onCommand={onCommand} command="h5" icon={<Heading5 size={18} />} />
        <ToolbarButton onCommand={onCommand} command="h6" icon={<Heading6 size={18} />} />
      </div>

      <div className={groupClass}>
        <ToolbarButton onCommand={onCommand} command="bold" icon={<Bold size={18} />} />
        <ToolbarButton onCommand={onCommand} command="italic" icon={<Italic size={18} />} />
        <ToolbarButton onCommand={onCommand} command="underline" icon={<Underline size={18} />} />
        <ToolbarButton onCommand={onCommand} command="strike" icon={<Strikethrough size={18} />} />
        <ToolbarButton onCommand={onCommand} command="inlineCode" icon={<Code size={18} />} />
      </div>

      <div className={groupClass}>
        <ToolbarButton onCommand={onCommand} command="quote" icon={<Quote size={18} />} />
        <ToolbarButton onCommand={onCommand} command="orderedList" icon={<ListOrdered size={18} />} />
        <ToolbarButton onCommand={onCommand} command="unorderedList" icon={<List size={18} />} />
        <ToolbarButton onCommand={onCommand} command="taskList" icon={<Square size={18} />} />
        <ToolbarButton onCommand={onCommand} command="doneTask" icon={<CheckSquare size={18} />} />
      </div>

      <div className={groupClass}>
        <ToolbarButton onCommand={onCommand} command="codeBlock" icon={<ListChecks size={18} />} />
        <ToolbarButton onCommand={onCommand} command="mathBlock" icon={<Sigma size={18} />} />
        <ToolbarButton onCommand={onCommand} command="link" icon={<Link size={18} />} />
        <ImageInsertMenu onChooseFile={onChooseImageFile} onInsertUrl={onInsertImageUrl} />
        <ToolbarButton onCommand={onCommand} command="table" icon={<Table size={18} />} />
        <ToolbarButton onCommand={onCommand} command="divider" icon={<Minus size={18} />} />
      </div>

      <div className="flex items-center gap-0.5">
        <ToolbarButton onCommand={onCommand} command="clearFormat" icon={<Eraser size={18} />} />
      </div>
    </div>
  );
};

export default MarkdownToolbar;
