import { apiRequest } from './api';

export const toolService = {
  async getTools() {
    return await apiRequest('/tools');
  },
};
