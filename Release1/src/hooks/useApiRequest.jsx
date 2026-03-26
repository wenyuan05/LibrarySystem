import { useState, useCallback } from 'react';
import { useToast } from '../context/ToastContext';

/**
 * 自定义 hook 用于处理 API 请求
 * @param {Function} apiFunction - 要调用的 API 函数
 * @param {Object} options - 配置选项
 * @param {boolean} options.showSuccess - 是否显示成功消息
 * @param {string} options.successMessage - 成功消息
 * @param {boolean} options.showError - 是否显示错误消息
 * @returns {Object} - 包含 loading、error、execute 函数的对象
 */
const useApiRequest = (apiFunction, options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const { showSuccess = false, successMessage = 'Operation successful', showError = true } = options;

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction(...args);
      
      if (showSuccess) {
        showToast(successMessage, 'success');
      }
      
      return result;
    } catch (err) {
      setError(err);
      
      if (showError) {
        showToast(err.message || 'An error occurred', 'error');
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, showSuccess, successMessage, showError, showToast]);

  return { loading, error, execute };
};

export default useApiRequest;