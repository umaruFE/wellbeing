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
   * @returns {Promise<object>} Workflow 执行结果
   */
  async call(workflowName, payload, options = {}) {
    const webhookUrl = `${this.baseUrl}/webhook/${workflowName}`;
    const timeout = options.timeout || 60000;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`N8N调用失败: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`N8N调用超时: ${timeout}ms`);
      }
      throw error;
    }
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

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(
        `${this.baseUrl}/api/v1/executions/${executionId}?includeData=true`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const status = data.data?.status;

        if (status === 'success') {
          return { status: 'completed', data: data };
        } else if (status === 'error') {
          return { status: 'error', error: '执行失败' };
        }
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
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
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
