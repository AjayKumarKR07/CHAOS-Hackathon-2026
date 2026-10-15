import { apiRequest } from './api';

export const taskService = {
  async getTasks(status = null, priority = null) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return await apiRequest(`/tasks${queryString}`);
  },

  async createTask(taskData) {
    return await apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },

  async updateTask(taskId, updates) {
    return await apiRequest(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteTask(taskId) {
    return await apiRequest(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },
};
