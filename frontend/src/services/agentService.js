import { apiRequest } from './api';

export const agentService = {
  async triggerRun(requestText, simulateFailure = false, failureStep = null) {
    return await apiRequest('/agent/runs', {
      method: 'POST',
      body: JSON.stringify({
        request: requestText,
        simulate_failure: simulateFailure,
        failure_step: failureStep,
      }),
    });
  },

  async getRuns() {
    return await apiRequest('/agent/runs');
  },

  async getRunById(runId) {
    return await apiRequest(`/agent/runs/${runId}`);
  },

  async retryEntireRun(runId) {
    return await apiRequest(`/agent/runs/${runId}/retry`, {
      method: 'POST',
    });
  },

  async retryStep(runId, stepId) {
    return await apiRequest(`/agent/runs/${runId}/steps/${stepId}/retry`, {
      method: 'POST',
    });
  },

  async getStats() {
    return await apiRequest('/agent/stats');
  },

  async getStepEvidence(runId, stepId) {
    return await apiRequest(`/agent/runs/${runId}/steps/${stepId}/evidence`);
  },

  async getRecoveryAnalytics(dateRange = 'all', statusFilter = 'ALL') {
    const params = new URLSearchParams({
      date_range: dateRange,
      status_filter: statusFilter,
    });
    return await apiRequest(`/agent/analytics/recovery?${params.toString()}`);
  },
};
