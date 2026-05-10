import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import JSZip from 'jszip';

function replaceOklabFn(css) {
  return css
    .replace(/oklab\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\)/gi, '#000000')
    .replace(/oklch\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\)/gi, '#000000');
}

function fixOklabColors(clonedDoc, targetEl) {
  clonedDoc.querySelectorAll('style').forEach(styleEl => {
    const text = styleEl.textContent || '';
    if (/okl(?:ab|ch)/i.test(text)) {
      styleEl.textContent = replaceOklabFn(text);
    }
  });

  clonedDoc.querySelectorAll('[style]').forEach(el => {
    const style = el.getAttribute('style');
    if (style && /okl(?:ab|ch)/i.test(style)) {
      el.setAttribute('style', replaceOklabFn(style));
    }
  });

  targetEl.querySelectorAll('*').forEach(el => {
    const s = el.style;
    for (let i = s.length - 1; i >= 0; i--) {
      const prop = s[i];
      const val = s.getPropertyValue(prop);
      if (val && /okl(?:ab|ch)/i.test(val)) {
        s.removeProperty(prop);
      }
    }
  });
}

/**
 * 导出元素为 PDF（单页）
 */
export async function exportToPDF(element, filename = 'export.pdf') {
  if (!element) {
    throw new Error('导出元素不存在');
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    onclone: (clonedDoc, clonedEl) => fixOklabColors(clonedDoc, clonedEl),
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [canvas.width / 2, canvas.height / 2],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
  pdf.save(filename);
}

/**
 * 导出多个元素为多页 PDF
 */
export async function exportMultipleToPDF(elements, filename = 'export.pdf', title = 'Export') {
  if (!elements || elements.length === 0) {
    throw new Error('没有可导出的内容');
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: 'a4',
  });

  for (let i = 0; i < elements.length; i++) {
    if (i > 0) {
      pdf.addPage();
    }

    const canvas = await html2canvas(elements[i], {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc, clonedEl) => fixOklabColors(clonedDoc, clonedEl),
    });

    const imgData = canvas.toDataURL('image/png');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
    const imgWidth = canvas.width * ratio;
    const imgHeight = canvas.height * ratio;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  }

  pdf.save(filename);
}

/**
 * 导出多个元素为 ZIP 包（每个元素一个 PNG）
 */
export async function exportToZip(elements, zipFilename = 'export.zip', prefix = 'page') {
  if (!elements || elements.length === 0) {
    throw new Error('没有可导出的内容');
  }

  const zip = new JSZip();

  for (let i = 0; i < elements.length; i++) {
    const canvas = await html2canvas(elements[i], {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc, clonedEl) => fixOklabColors(clonedDoc, clonedEl),
    });

    const imgData = canvas.toDataURL('image/png').split(',')[1];
    const paddedIndex = String(i + 1).padStart(3, '0');
    zip.file(`${prefix}_${paddedIndex}.png`, imgData, { base64: true });
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = zipFilename;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * 导出元素为单个 PNG 图片
 */
export async function exportToPNG(element, filename = 'export.png') {
  if (!element) {
    throw new Error('导出元素不存在');
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    onclone: (clonedDoc, clonedEl) => fixOklabColors(clonedDoc, clonedEl),
  });

  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = filename;
  link.click();
}

/**
 * 下载文件（通用）
 */
export function downloadFile(content, filename, mimeType = 'application/octet-stream') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
