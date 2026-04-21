/**
 * N8N 统一客户端
 * 
 * 提供统一的接口调用 N8N Workflow，包括：
 * - call(workflowName, payload, options): 调用工作流
 * - pollExecution(executionId, options): 轮询执行状态
 * - getExecutionData(executionId): 获取执行结果
 */

const N8N_API_BASE = process.env.N8N_API_BASE_URL || 'http://117.50.218.161:5678';
const N8N_API_KEY = process.env.N8N_API_KEY;

class N8NClient {
  constructor() {
    this.baseUrl = N8N_API_BASE;
    this.apiKey = N8N_API_KEY;
  }

  /**
   * 调用 N8N Workflow
   * @param {string} workflowName - 工作流名称（Webhook 路径）
   * @param {object} payload - 传递给 Workflow 的参数
   * @param {object} options - 额外选项
   * @param {string} options.method - HTTP 方法，默认 POST
   * @returns {Promise<object>} Workflow 执行结果
   */
  async call(workflowName, payload, options = {}) {
    const timeout = options.timeout || 60000;
    const method = options.method || 'POST';

    let webhookUrl = `${this.baseUrl}/webhook/${workflowName}`;

    // GET 请求将 payload 转为 query string
    if (method === 'GET' && payload) {
      const params = new URLSearchParams(payload).toString();
      if (params) webhookUrl += `?${params}`;
    }

    console.log(`[n8n.call] ${method} ${webhookUrl}`);
    console.log(`[n8n.call] API Key: ${this.apiKey ? '已设置' : '未设置'}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const fetchOptions = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-N8N-API-KEY': this.apiKey })
        },
        signal: controller.signal
      };

      // POST 请求才带 body
      if (method === 'POST' && payload) {
        console.log(`[n8n.call] Payload:`, JSON.stringify(payload, null, 2));
        fetchOptions.body = JSON.stringify(payload);
      }

      const response = await fetch(webhookUrl, fetchOptions);

      clearTimeout(timeoutId);

      console.log(`[n8n.call] 响应状态: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`[n8n.call] 错误响应: ${errorText}`);
        throw new Error(`N8N调用失败: ${response.status}`);
      }

      const resultText = await response.text();
      console.log(`[n8n.call] 响应结果: ${resultText || '(空响应)'}`);
      if (!resultText.trim()) {
        return null;
      }
      const result = JSON.parse(resultText);
      return result;

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`N8N调用超时: ${timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * 获取 API 请求头
   */
  getHeaders() {
    // N8N REST API 使用 X-N8N-API-KEY header
    if (this.apiKey) {
      return { 'X-N8N-API-KEY': this.apiKey };
    }
    return {};
  }

  /**
   * 轮询 N8N 执行状态
   * @param {string} executionId - 执行ID
   * @param {object} options - 轮询选项
   * @returns {Promise<object>} 执行结果
   */
  async pollExecution(executionId, options = {}) {
    const maxAttempts = options.maxAttempts || 60;
    const interval = options.interval || 3000;

    const statusUrl = `${this.baseUrl}/api/v1/executions/${executionId}?includeData=true`;
    console.log(`[pollExecution] GET ${statusUrl}`);
    console.log(`[pollExecution] API Key: ${this.apiKey || '(未设置)'}`);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      console.log(`[pollExecution] 第 ${attempt + 1} 次尝试...`);

      const response = await fetch(statusUrl, {
        headers: this.getHeaders()
      });

      console.log(`[pollExecution] 响应状态: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        const status = data.status;
        const finished = data.finished;

        console.log(`[pollExecution] 状态: ${status}, finished: ${finished}`);

        // N8N 可能的状态: success, error, running, waiting, stopped
        if (status === 'success' || finished === true) {
          return { status: 'completed', data: data };
        } else if (status === 'error' || status === 'stopped') {
          return { status: 'error', error: '执行失败', data: data };
        } else if (status === 'running' || status === 'waiting') {
          // 继续轮询
          console.log(`[pollExecution] 执行中, 等待 ${interval}ms...`);
        }
      } else {
        console.log(`[pollExecution] API 响应失败: ${response.status}`);
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    return { status: 'timeout' };
  }

  /**
   * 获取执行结果数据
   * @param {string} executionId - 执行ID
   * @returns {Promise<object>} 结果数据
   */
  async getExecutionData(executionId) {
    const response = await fetch(
      `${this.baseUrl}/api/v1/executions/${executionId}?includeData=true`,
      {
        headers: this.getHeaders()
      }
    );

    if (!response.ok) {
      throw new Error(`获取执行数据失败: ${response.status}`);
    }

    const data = await response.json();
    return data.data?.executionData?.resultData?.runData || {};
  }
}

export const n8nClient = new N8NClient();
export default n8nClient;
