import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wand2 } from 'lucide-react';
import IPSceneGenerator from '../../components/IPSceneGenerator';
import { useAuth } from '../../contexts/AuthContext';
import { GeneratorPageLayout } from './GeneratorPageLayout';

const usageSteps = [
  'fe12ea8624', '760e7c0d54', '4e3948808c', '3832717b58',
  '11a8fd24a7', 'f67d18238f', 'c16a2a500d', '8077546917',
];

export default function IPSceneTestPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showGenerator, setShowGenerator] = useState(false);
  const userId = user?.id ?? null;
  const organizationId = user?.organizationId ?? user?.organization_id ?? null;

  return (
    <GeneratorPageLayout title={t('testIpUi.ba8644ec76')}>
      <section className="wb-surface-panel space-y-4">
        <button type="button" data-wb-button="primary" aria-haspopup="dialog" disabled={!userId} onClick={() => setShowGenerator(true)}>
          <Wand2 size={16} aria-hidden="true" />{t('testIpUi.fa213797c6')}
        </button>
        <h2 className="wb-section-title">{t('testAudioUi.15683f6cd3')}</h2>
        <ol className="list-decimal space-y-2 pl-5 text-[var(--wb-muted)]">
          {usageSteps.map((key) => <li key={key}>{t(`testIpUi.${key}`)}</li>)}
        </ol>
      </section>
      <IPSceneGenerator
        isOpen={showGenerator && Boolean(userId)}
        onClose={() => setShowGenerator(false)}
        userId={userId}
        organizationId={organizationId}
      />
    </GeneratorPageLayout>
  );
}
