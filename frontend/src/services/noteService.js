import { apiRequest } from './api';

export const noteService = {
  async getNotes() {
    return await apiRequest('/notes');
  },

  async createNote(noteData) {
    return await apiRequest('/notes', {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  },

  async deleteNote(noteId) {
    return await apiRequest(`/notes/${noteId}`, {
      method: 'DELETE',
    });
  },
};
