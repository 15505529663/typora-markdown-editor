import React, { useState } from 'react';
import { ArrowRight, FileText, FolderLock, Image, ListTree, UploadCloud } from 'lucide-react';

interface WelcomeScreenProps {
  onEnter: () => void;
}

const features = [
  { label: '本地保存', icon: FolderLock },
  { label: '快捷编辑', icon: FileText },
  { label: '大纲导航', icon: ListTree },
  { label: '图片粘贴', icon: Image },
  { label: '导入导出', icon: UploadCloud },
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onEnter }) => {
  const [isLeaving, setIsLeaving] = useState(false);

  const handleEnter = () => {
    if (isLeaving) return;
    setIsLeaving(true);
    window.setTimeout(onEnter, 520);
  };

  return (
    <div className={`welcome-screen ${isLeaving ? 'welcome-screen-leave' : ''}`}>
      <div className="welcome-ambient" />
      <div className="welcome-editor-shell" aria-hidden="true">
        <div className="welcome-editor-top">
          <span />
          <span />
          <span />
        </div>
        <div className="welcome-editor-body">
          <div className="welcome-editor-sidebar">
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="welcome-editor-paper">
            <b># 专注写作</b>
            <p>**本地 Markdown** 编辑体验</p>
            <p>- 大纲</p>
            <p>- 图片</p>
            <p>- 导出</p>
            <em />
            <em />
          </div>
        </div>
      </div>

      <section className="welcome-card">
        <div className="welcome-kicker">MarkEdit</div>
        <h1>专注写作，从本地开始</h1>
        <p>一个简洁、快速、类似 Typora 体验的本地 Markdown 编辑器。</p>

        <button type="button" onClick={handleEnter} className="welcome-start-button">
          <span>开始使用</span>
          <ArrowRight size={18} />
        </button>

        <div className="welcome-features">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <span key={feature.label}>
                <Icon size={15} />
                {feature.label}
              </span>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default WelcomeScreen;
