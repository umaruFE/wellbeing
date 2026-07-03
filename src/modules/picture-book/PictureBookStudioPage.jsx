import React from 'react';
import { BookOpenText, CheckCircle2, Images, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ImageAssetWizard } from '../../figma-restore/course-workflow/ppt/right-asset-panel/ImageAssetWizard';
import '../../figma-restore/course-workflow/ppt/css/PptAssetPanel.css';
import './PictureBookStudioPage.css';

export function PictureBookStudioPage() {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const [wizardTitle, setWizardTitle] = React.useState(isEn ? 'Picture Book Studio' : '绘本制作');
  const [completedBook, setCompletedBook] = React.useState(null);

  const asset = React.useMemo(() => ({
    code: 'B9',
    title: isEn ? 'Picture Book' : '绘本故事配图',
    description: isEn ? 'Create a consistent multi-page story' : '多页故事，角色与画风保持一致',
    icon: BookOpenText,
  }), [isEn]);

  const completedPages = completedBook?.items?.filter((item) => item?.url) || [];

  return (
    <div id="ed-ppt" className="picture-book-studio">
      <header className="picture-book-hero">
        <div className="picture-book-hero-icon"><BookOpenText size={28} /></div>
        <div>
          <span><Sparkles size={14} /> AI Picture Book</span>
          <h1>{isEn ? 'Picture Book Studio' : '绘本制作工坊'}</h1>
          <p>{isEn ? 'Turn a story into a consistent, classroom-ready picture book.' : '把故事按行拆成页面，一次生成角色统一、可用于课堂的完整绘本。'}</p>
        </div>
      </header>

      <div className="picture-book-layout">
        <section className="picture-book-wizard-card ppt-asset-panel-image">
          <div className="picture-book-card-head">
            <div>
              <span>{isEn ? 'Creation flow' : '创作流程'}</span>
              <h2>{wizardTitle}</h2>
            </div>
            <em>{isEn ? 'One line = one page' : '每行文字生成一页'}</em>
          </div>
          <div className="picture-book-wizard-body">
            <ImageAssetWizard
              asset={asset}
              onBack={() => {}}
              onTitleChange={setWizardTitle}
              insertLabel={isEn ? 'Finish Picture Book' : '完成绘本'}
              onInsert={(_kind, generatedBook) => setCompletedBook(generatedBook)}
            />
          </div>
        </section>

        <aside className="picture-book-guide">
          <div className="picture-book-guide-card">
            <Images size={22} />
            <h3>{isEn ? 'How it works' : '怎么制作'}</h3>
            <ol>
              <li>{isEn ? 'Name your picture book.' : '填写绘本名称。'}</li>
              <li>{isEn ? 'Put each page on a new line.' : '每页文案单独占一行。'}</li>
              <li>{isEn ? 'Confirm the storyboard and generate.' : '确认分镜后开始生成。'}</li>
            </ol>
          </div>

          <div className="picture-book-character-card">
            <span>Poppy</span>
            <strong>{isEn ? 'Character consistency is on' : '已开启角色一致性'}</strong>
            <p>{isEn ? 'The same character bible and visual style are repeated on every page.' : '每页都会复用同一套角色设定与画风描述。'}</p>
          </div>

          {completedPages.length ? (
            <div className="picture-book-complete-card">
              <CheckCircle2 size={22} />
              <div>
                <strong>{isEn ? 'Picture book completed' : '绘本已完成'}</strong>
                <span>{isEn ? `${completedPages.length} pages saved to Images` : `共 ${completedPages.length} 页，已保存到图片库`}</span>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
