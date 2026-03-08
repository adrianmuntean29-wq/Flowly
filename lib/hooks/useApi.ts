'use client';

import { useAuth } from '@/lib/context/AuthContext';

export function useApiClient() {
  const { token, logout } = useAuth();

  const request = async (
    endpoint: string,
    options: RequestInit = {}
  ) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    // Session expired — auto logout and redirect
    if (response.status === 401) {
      logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `API error: ${response.status}`);
    }

    return response.json();
  };

  return { request };
}

export function useContentGeneration() {
  const { request } = useApiClient();

  const generate = async (prompt: string, postType: string, options?: any) => {
    return request('/api/generate/content', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        postType,
        ...options,
      }),
    });
  };

  return { generate };
}

export function usePosts() {
  const { request } = useApiClient();

  const list = async (status?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    return request(`/api/posts?${params.toString()}`);
  };

  const create = async (data: any) => {
    return request('/api/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  const get = async (id: string) => {
    return request(`/api/posts/${id}`);
  };

  const update = async (id: string, data: any) => {
    return request(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  };

  const delete_ = async (id: string) => {
    return request(`/api/posts/${id}`, {
      method: 'DELETE',
    });
  };

  return { list, create, get, update, delete: delete_ };
}

export function useTemplates() {
  const { request } = useApiClient();

  const list = async (postType?: string) => {
    const params = new URLSearchParams();
    if (postType) params.append('type', postType);
    return request(`/api/templates?${params.toString()}`);
  };

  const create = async (data: any) => {
    return request('/api/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  const update = async (id: string, data: any) => {
    return request(`/api/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  };

  const delete_ = async (id: string) => {
    return request(`/api/templates/${id}`, {
      method: 'DELETE',
    });
  };

  return { list, create, update, delete: delete_ };
}

export function useMedia() {
  const { token } = useAuth();

  const authHeader = (): Record<string, string> =>
    token ? { Authorization: `Bearer ${token}` } : {};

  const listFiles = async (): Promise<{ files: any[] }> => {
    const res = await fetch('/api/upload', { headers: authHeader() });
    if (!res.ok) throw new Error('Failed to list media');
    return res.json();
  };

  const uploadFile = async (file: File): Promise<any> => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: authHeader(),
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Upload failed');
    }
    return res.json();
  };

  const deleteFile = async (filename: string): Promise<void> => {
    const res = await fetch('/api/upload', {
      method: 'DELETE',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    });
    if (!res.ok) throw new Error('Delete failed');
  };

  return { listFiles, uploadFile, deleteFile };
}

export function useProfile() {
  const { request } = useApiClient();

  const get = async () => {
    return request('/api/user/profile');
  };

  const update = async (data: any) => {
    return request('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  };

  return { get, update };
}
