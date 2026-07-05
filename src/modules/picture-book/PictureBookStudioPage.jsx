import React from 'react';
import {
  BookOpenText,
  CheckCircle2,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ImageAssetWizard } from '../../figma-restore/course-workflow/ppt/right-asset-panel/ImageAssetWizard';
import '../../figma-restore/course-workflow/ppt/css/PptAssetPanel.css';
import './PictureBookStudioPage.css';

export function PictureBookStudioPage() {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const [wizardTitle, setWizardTitle] = React.useState(isEn ? 'Picture Book Studio' : '绘本制作');
  const [completedBook, setCompletedBook] = React.useState(null);

  React.useEffect(() => {
    setWizardTitle(isEn ? 'Picture Book Studio' : '绘本制作');
  }, [isEn]);

  const asset = React.useMemo(() => ({
    code: 'B9',
    title: isEn ? 'Picture Book' : '绘本故事配图',
    description: isEn ? 'Create a consistent multi-page story' : '多页故事，角色与画风保持一致',
    icon: BookOpenText,
  }), [isEn]);

  const completedPages = completedBook?.items?.filter((item) => item?.url) || [];

  return (
    <main id="ed-ppt" className="picture-book-studio">
      <section className="picture-book-topbar">
        <div className="picture-book-title-block">
          <span className="picture-book-kicker"><Sparkles size={15} /> AI Picture Book</span>
          <h1>{isEn ? 'Picture Book Studio' : '绘本制作工坊'}</h1>
          <p>{isEn ? 'Create consistent, classroom-ready storybooks in a full workspace.' : '在 工作台中完成故事拆页、统一画风生成和绘本结果管理。'}</p>
        </div>
      </section>

      <div className="picture-book-layout">
        <section className="picture-book-workspace ppt-asset-panel-image">
          <div className="picture-book-workspace-head">
            <div>
              <span><LayoutDashboard size={15} /> {isEn ? 'Generation Desk' : '生成工作台'}</span>
              <h2>{wizardTitle}</h2>
            </div>
            <strong>{isEn ? 'One line = one page' : '每行生成一页'}</strong>
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

        {completedPages.length ? (
          <aside className="picture-book-sidepanel">
            <section className="picture-book-panel picture-book-complete-panel">
              <div className="picture-book-complete-head">
                <CheckCircle2 size={19} />
                <div>
                  <strong>{isEn ? 'Picture book completed' : '绘本已完成'}</strong>
                  <span>{isEn ? `${completedPages.length} pages saved` : `已保存 ${completedPages.length} 页`}</span>
                </div>
              </div>
              <div className="picture-book-thumb-grid">
                {completedPages.slice(0, 6).map((page, index) => (
                  <img key={page.url || index} src={page.url} alt={`${isEn ? 'Page' : '页面'} ${index + 1}`} />
                ))}
              </div>
            </section>
          </aside>
        ) : null}
      </div>
    </main>
  );
}
