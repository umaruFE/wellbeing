// 保存历史记录
export const saveToHistory = (courseData, history, historyIndex, setHistory, setHistoryIndex) => {
  const newHistory = history.slice(0, historyIndex + 1);
  newHistory.push(JSON.parse(JSON.stringify(courseData)));
  if (newHistory.length > 50) {
    newHistory.shift();
  }
  setHistory(newHistory);
  setHistoryIndex(newHistory.length - 1);
};

// 处理撤销操作
export const handleUndo = (history, historyIndex, setHistoryIndex, setCourseData) => {
  if (historyIndex > 0) {
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setCourseData(JSON.parse(JSON.stringify(history[newIndex])));
  }
};

// 处理重做操作
export const handleRedo = (history, historyIndex, setHistoryIndex, setCourseData) => {
  if (historyIndex < history.length - 1) {
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setCourseData(JSON.parse(JSON.stringify(history[newIndex])));
  }
};
