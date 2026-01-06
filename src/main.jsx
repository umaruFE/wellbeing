import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './home.jsx'

console.log('开始渲染应用...');
console.log('App 组件:', App);

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('找不到 root 元素！');
} else {
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('应用渲染成功');
  } catch (error) {
    console.error('渲染错误:', error);
    rootElement.innerHTML = `
      <div style="padding: 20px; color: red; font-family: monospace;">
        <h1>渲染错误</h1>
        <p><strong>错误信息:</strong> ${error.message}</p>
        <pre style="background: #f0f0f0; padding: 10px; overflow: auto;">${error.stack}</pre>
      </div>
    `;
  }
}
