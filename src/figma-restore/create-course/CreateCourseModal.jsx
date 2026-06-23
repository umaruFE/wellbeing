import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form, Modal, message } from 'antd';
import { Loader2 } from 'lucide-react';
import apiService from '../../services/api';
import { CreateCourseStepFour } from './CreateCourseStepFour';
import { CreateCourseStepOne } from './CreateCourseStepOne';
import { CreateCourseStepThree } from './CreateCourseStepThree';
import { CreateCourseStepTwo } from './CreateCourseStepTwo';
import {
  adventureIdeas,
  createCourseSteps,
  defaultCreateCourseValues,
} from './createCourseOptions';
import './CreateCourseModal.css';

const stepFields = [
  ['age', 'duration', 'classSize'],
  ['taskName', 'storyContext', 'keyOutcome'],
  ['experiencePaths'],
  [],
];

function normalizeExperiencePaths(values) {
  return Array.isArray(values) ? values.filter(Boolean) : (values ? [values] : []);
}

function primaryExperiencePath(paths) {
  return normalizeExperiencePaths(paths)[0] || '';
}

function splitListValue(value, separators) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => splitListValue(item, separators));
  }
  return String(value)
    .split(separators)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitGrammarValue(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.flatMap(splitGrammarValue);
  }
  return splitListValue(value, /\r?\n/)
    .flatMap((line) => line
      .split(/(?<=\?)\s+|(?<=\.\.\.)\s+(?=[A-Z])/)
      .map((item) => item.trim())
      .filter(Boolean));
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
}

const AI_GENERATED_COURSE_TITLE = '';

export function CreateCourseModal({ open, onCancel, onSubmit }) {
  const { t, i18n } = useTranslation();
  const isChinese = !i18n.language?.startsWith('en');
  const aiLanguage = isChinese ? 'zh' : 'en';
  const outputLanguage = isChinese ? 'Chinese' : 'English';
  const [form] = Form.useForm();
  const [current, setCurrent] = useState(0);
  const [ideaIndex, setIdeaIndex] = useState(-1);
  const [submitting, setSubmitting] = useState(false);
  const [ideaLoading, setIdeaLoading] = useState(false);
  const [polishLoading, setPolishLoading] = useState(false);
  const createFlowAbortRef = useRef(null);
  const mountedRef = useRef(false);
  const watchedValues = Form.useWatch([], form);

  const canPolish = useMemo(() => {
    const values = watchedValues || {};
    return ['taskName', 'storyContext', 'keyOutcome'].some(name => String(values[name] || '').trim());
  }, [watchedValues]);

  const resetFlow = () => {
    setCurrent(0);
    setIdeaIndex(-1);
    form.setFieldsValue(defaultCreateCourseValues);
  };

  const cancelCreateFlow = () => {
    if (createFlowAbortRef.current) {
      createFlowAbortRef.current.abort();
      createFlowAbortRef.current = null;
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelCreateFlow();
    };
  }, []);

  useEffect(() => {
    if (!open) cancelCreateFlow();
  }, [open]);

  const handleCancel = () => {
    cancelCreateFlow();
    setSubmitting(false);
    resetFlow();
    onCancel?.();
  };

  const handleApplyIdea = async () => {
    if (ideaLoading) return;
    setIdeaLoading(true);
    try {
      const values = form.getFieldsValue(true);
      const payload = {
        language: aiLanguage,
        outputLanguage,
        courseTitle: AI_GENERATED_COURSE_TITLE,
        age: values.age,
        duration: values.duration,
        scale: values.classSize,
        vocabulary: values.vocabularies || [],
        grammar: values.grammars || [],
        skills: values.languageSkills || [],
        paths: normalizeExperiencePaths(values.experiencePaths || values.experiencePath),
        taskName: values.taskName || '',
        storyContext: values.storyContext || '',
        keyOutcome: values.keyOutcome || '',
      };
      const response = await fetch('/api/ai/generate-course-idea', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.success && result.data) {
        const data = result.data;
        const textData = data.text ? (() => { try { return JSON.parse(data.text); } catch { return data; } })() : data;
        form.setFieldsValue({
          taskName: textData.taskName || data.taskName || '',
          storyContext: textData.storyContext || data.storyContext || '',
          keyOutcome: textData.keyOutcome || data.keyOutcome || '',
        });
        message.success(t('createCourse.ideaGenerated'));
      } else {
        message.error(result.error || t('createCourse.ideaFailed'));
      }
    } catch (err) {
      console.error('fetch idea failed:', err);
      message.error(t('createCourse.ideaFailedRetry'));
    } finally {
      setIdeaLoading(false);
    }
  };

  const handlePolish = async () => {
    if (polishLoading) return;
    setPolishLoading(true);
    try {
      const values = form.getFieldsValue(['taskName', 'storyContext', 'keyOutcome']);
      const payload = {
        language: aiLanguage,
        outputLanguage,
        courseTitle: AI_GENERATED_COURSE_TITLE,
        taskName: values.taskName?.trim() || '',
        storyContext: values.storyContext?.trim() || '',
        keyOutcome: values.keyOutcome?.trim() || '',
      };
      const response = await fetch('/api/ai/polish-course-content', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.success && result.data) {
        const data = result.data;
        const textData = data.text ? (() => { try { return JSON.parse(data.text); } catch { return data; } })() : data;
        form.setFieldsValue({
          taskName: textData.taskName || data.taskName || payload.taskName,
          storyContext: textData.storyContext || data.storyContext || payload.storyContext,
          keyOutcome: textData.keyOutcome || data.keyOutcome || payload.keyOutcome,
        });
        message.success(t('createCourse.polished'));
      } else {
        message.error(result.error || t('createCourse.polishFailed'));
      }
    } catch (err) {
      console.error('polish failed:', err);
      message.error(t('createCourse.polishFailedRetry'));
    } finally {
      setPolishLoading(false);
    }
  };

  const handleNext = async () => {
    try {
      await form.validateFields(stepFields[current]);
      if (current < createCourseSteps.length - 1) {
        setCurrent(value => value + 1);
        return;
      }

      if (submitting) return;
      setSubmitting(true);

      const stepValues = await form.validateFields();
      const values = form.getFieldsValue(true);
      Object.assign(values, stepValues);
      const user = getUser();
      const attachments = (values.attachments || []).map(file => file.name).filter(Boolean);
      const vocabularies = splitListValue(values.vocabularies, /[,\uFF0C]+/);
      const grammars = splitGrammarValue(values.grammars);

      const n8nPayload = {
        language: aiLanguage,
        outputLanguage,
        courseTitle: AI_GENERATED_COURSE_TITLE,
        age: values.age,
        duration: values.duration,
        scale: values.classSize,
        vocabulary: vocabularies,
        grammar: grammars,
        skills: values.languageSkills || [],
        paths: normalizeExperiencePaths(values.experiencePaths || values.experiencePath),
        theme: values.taskName || '',
        taskName: values.taskName || '',
        storyContext: values.storyContext || '',
        keyOutcome: values.keyOutcome || '',
        atmosphere: values.atmosphere || '',
        specialRequirements: values.specialRequirements || '',
        attachments,
        userId: user?.id || null,
        organizationId: user?.organization_id || null,
      };

      let overview = null;
      let themeImageUrl = null;
      const abortController = new AbortController();

      cancelCreateFlow();
      createFlowAbortRef.current = abortController;

      try {
        const response = await fetch('/api/ai/generate-course-overview', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(n8nPayload),
          signal: abortController.signal,
        });
        const result = await response.json();

        if (result.success && result.data) {
          overview = result.data.courseOverview || result.data;
          themeImageUrl = result.data.themeImageUrl || null;
        } else {
          throw new Error(result.error || 'Course overview generation failed');
        }
      } catch (err) {
        if (createFlowAbortRef.current === abortController) {
          createFlowAbortRef.current = null;
        }
        if (err?.name === 'AbortError') {
          if (mountedRef.current) {
            setSubmitting(false);
            message.info(isChinese ? '已取消课程生成' : 'Course generation canceled');
          }
          return;
        }
        console.warn('概览生成请求失败，停止保存课程:', err);
        if (mountedRef.current) {
          setSubmitting(false);
          message.error(err?.message || (isChinese ? '课程概览生成失败，请重试' : 'Course overview generation failed, please try again'));
        }
        return;
      }

      if (abortController.signal.aborted || !mountedRef.current) return;

      const courseTitle = overview?.courseTitle || t('dashboard.unnamedCourse');
      const theme = overview?.theme || values.taskName || '';

      const keywordsList = [...vocabularies, ...grammars];

      const saveData = {
        title: courseTitle,
        description: overview?.overallContext || values.storyContext || '',
        ageGroup: values.age,
        unit: values.classSize,
        duration: values.duration,
        theme: theme,
        keywords: keywordsList,
        courseData: {
          courseOverview: overview,
          themeImageUrl,
          language: aiLanguage,
          outputLanguage,
          age: values.age,
          duration: values.duration,
          classSize: values.classSize,
          vocabularies,
          grammars,
          languageSkills: values.languageSkills || [],
          experiencePaths: normalizeExperiencePaths(values.experiencePaths || values.experiencePath),
          experiencePath: primaryExperiencePath(values.experiencePaths || values.experiencePath),
          taskName: values.taskName || '',
          storyContext: values.storyContext || '',
          keyOutcome: values.keyOutcome || '',
          atmosphere: values.atmosphere || '',
          specialRequirements: values.specialRequirements || '',
        },
        themeImageUrl,
        status: 'draft',
        userId: user?.id || null,
        organizationId: user?.organization_id || null,
      };

      let savedCourseId = null;
      try {
        const saveResult = await apiService.createCourse(saveData, { signal: abortController.signal });
        if (abortController.signal.aborted || !mountedRef.current) return;
        savedCourseId = saveResult?.data?.id || saveResult?.id || null;
        if (!savedCourseId) {
          throw new Error(isChinese ? '课程保存失败，没有返回课程 ID' : 'Course save failed without a course ID');
        }
      } catch (err) {
        if (createFlowAbortRef.current === abortController) {
          createFlowAbortRef.current = null;
        }
        if (err?.name === 'AbortError') {
          if (mountedRef.current) {
            setSubmitting(false);
            message.info(isChinese ? '已取消课程生成' : 'Course generation canceled');
          }
          return;
        }
        console.error('保存课程失败:', err);
        if (mountedRef.current) {
          setSubmitting(false);
          message.error(isChinese ? '课程保存失败，请重试' : 'Course save failed, please try again');
        }
        return;
      }

      if (createFlowAbortRef.current === abortController) {
        createFlowAbortRef.current = null;
      }

      message.success(t('createCourse.courseCreated'));
      resetFlow();
      setSubmitting(false);

      onSubmit?.({
        ...values,
        id: savedCourseId,
        courseOverview: overview,
        themeImageUrl,
        title: courseTitle,
        theme,
        language: aiLanguage,
        outputLanguage,
        age: values.age,
        duration: values.duration,
        classSize: values.classSize,
        vocabularies,
        grammars,
        languageSkills: values.languageSkills || [],
        experiencePaths: normalizeExperiencePaths(values.experiencePaths || values.experiencePath),
        experiencePath: primaryExperiencePath(values.experiencePaths || values.experiencePath),
        taskName: values.taskName || '',
        storyContext: values.storyContext || '',
        keyOutcome: values.keyOutcome || '',
        atmosphere: values.atmosphere || '',
        specialRequirements: values.specialRequirements || '',
      });
    } catch {
      if (mountedRef.current) setSubmitting(false);
      message.warning(t('createCourse.completeRequired'));
    }
  };

  const stepContent = [
    <CreateCourseStepOne key="step-1" />,
    <CreateCourseStepTwo key="step-2" canPolish={canPolish} ideaLoading={ideaLoading} polishLoading={polishLoading} onApplyIdea={handleApplyIdea} onPolish={handlePolish} />,
    <CreateCourseStepThree key="step-3" />,
    <CreateCourseStepFour key="step-4" />,
  ];

  const modalTitle = (
    <div className="fr-create-modal-title">
      <span>{t('createCourse.title')}</span>
      <i className="fr-create-title-mark" />
      <i className="fr-create-title-dot large" />
      <i className="fr-create-title-dot small" />
    </div>
  );

  const modalFooter = (
    <div className="fr-create-footer-bar">
      <Button
        onClick={() => setCurrent(value => value - 1)}
        className={`fr-create-btn-cancel fr-create-prev ${current === 0 ? 'hidden' : ''}`}
        disabled={submitting}
      >
        {t('createCourse.prevStep')}
      </Button>
      <div className="fr-create-footer-actions">
        <Button onClick={handleCancel} className="fr-create-btn-cancel">{t('common.cancel')}</Button>
        <Button onClick={handleNext} className="fr-create-btn-next" disabled={submitting}>
          {submitting
            ? <>{t('common.generating')}</>
            : current === createCourseSteps.length - 1 ? t('createCourse.finish') : t('createCourse.nextStep')
          }
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      className="fr-create-modal"
      title={modalTitle}
      open={open}
      onCancel={handleCancel}
      width={858}
      centered
      destroyOnHidden
      footer={modalFooter}
      closable
      maskClosable={!submitting}
      afterOpenChange={(visible) => {
        if (visible) resetFlow();
      }}
    >
      <div className="fr-create-steps">
        {createCourseSteps.map((step, index) => (
          <div
            key={step.titleKey}
            className={`fr-create-step-item ${index === current ? 'active' : ''} ${index < current ? 'process' : ''}`}
          >
            <span className="fr-create-step-number">{index < current ? '✓' : index + 1}</span>
            <span className="fr-create-step-label">{t(step.titleKey)}</span>
            {index < createCourseSteps.length - 1 && <div className="fr-create-step-tail" />}
          </div>
        ))}
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={defaultCreateCourseValues}
        className="fr-create-form"
        requiredMark={false}
      >
        {stepContent[current]}
      </Form>
    </Modal>
  );
}
