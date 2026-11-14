// NEXUS OS - Unified Resilient API Client
// Handles authentication headers, HttpOnly cookies, consistent error formatting, and upload/download streaming.

export class ApiError extends Error {
  public status: number;
  public details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type UnauthorizedHandler = () => void;

const SESSION_TOKEN_KEY = 'nexus_session_token';

class ApiClient {
  private token: string | null = null;
  private onUnauthorizedCallbacks: Set<UnauthorizedHandler> = new Set();

  constructor() {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        this.token = window.sessionStorage.getItem(SESSION_TOKEN_KEY);
      }
    } catch {}
  }

  public setToken(token: string | null) {
    this.token = token;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        if (token) {
          window.sessionStorage.setItem(SESSION_TOKEN_KEY, token);
        } else {
          window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
        }
      }
    } catch {}
  }

  public getToken(): string | null {
    if (!this.token) {
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          this.token = window.sessionStorage.getItem(SESSION_TOKEN_KEY);
        }
      } catch {}
    }
    return this.token;
  }

  public onUnauthorized(cb: UnauthorizedHandler) {
    this.onUnauthorizedCallbacks.add(cb);
    return () => this.onUnauthorizedCallbacks.delete(cb);
  }

  private handleUnauthorized() {
    this.setToken(null);
    for (const cb of this.onUnauthorizedCallbacks) {
      try {
        cb();
      } catch (err) {
        console.error('Error in onUnauthorized callback:', err);
      }
    }
  }

  private getHeaders(extraHeaders: Record<string, string> = {}, isJson = true): HeadersInit {
    const headers: Record<string, string> = {
      ...extraHeaders,
    };
    if (isJson) {
      headers['Content-Type'] = 'application/json';
    }
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    if (res.status === 401) {
      this.handleUnauthorized();
    }

    if (!res.ok) {
      let errorMessage = `HTTP Error ${res.status}: ${res.statusText}`;
      let errorDetails: any = null;

      try {
        const data = await res.json();
        if (data && typeof data === 'object') {
          if (data.error) errorMessage = data.error;
          if (data.details) errorDetails = data.details;
        }
      } catch {
        try {
          const text = await res.text();
          if (text) errorMessage = text;
        } catch {
          // Keep default message
        }
      }

      throw new ApiError(errorMessage, res.status, errorDetails);
    }

    // If 204 No Content
    if (res.status === 204) {
      return {} as T;
    }

    return res.json() as Promise<T>;
  }

  public async get<T>(url: string): Promise<T> {
    const res = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    return this.handleResponse<T>(res);
  }

  public async post<T>(url: string, body?: any): Promise<T> {
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res);
  }

  public async patch<T>(url: string, body?: any): Promise<T> {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res);
  }

  public async put<T>(url: string, body?: any): Promise<T> {
    const res = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res);
  }

  public async delete<T>(url: string): Promise<T> {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    return this.handleResponse<T>(res);
  }

  public async upload<T>(url: string, formData: FormData, onProgress?: (percent: number) => void): Promise<T> {
    if (onProgress && typeof XMLHttpRequest !== 'undefined') {
      return new Promise<T>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.withCredentials = true;
        const token = this.getToken();
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            onProgress(pct);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 401) {
            this.handleUnauthorized();
          }
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch {
              resolve({} as T);
            }
          } else {
            let msg = `Upload failed with HTTP ${xhr.status}`;
            let details = null;
            try {
              const errObj = JSON.parse(xhr.responseText);
              if (errObj.error) msg = errObj.error;
              if (errObj.details) details = errObj.details;
            } catch {}
            reject(new ApiError(msg, xhr.status, details));
          }
        };

        xhr.onerror = () => {
          reject(new ApiError('Network error during file upload', 0));
        };

        xhr.send(formData);
      });
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders({}, false), // Do not set Content-Type, let browser set multipart boundary
      credentials: 'include',
      body: formData,
    });
    return this.handleResponse<T>(res);
  }

  public async download(url: string, fallbackFilename = 'download'): Promise<void> {
    const res = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders({}, false),
      credentials: 'include',
    });

    if (res.status === 401) {
      this.handleUnauthorized();
    }

    if (!res.ok) {
      let msg = `Download failed with HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson.error) msg = errJson.error;
      } catch {}
      throw new ApiError(msg, res.status);
    }

    // Determine filename from Content-Disposition header if available
    let filename = fallbackFilename;
    const disposition = res.headers.get('content-disposition');
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/i);
      if (match && match[1]) {
        filename = match[1].trim();
      }
    }

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  }
}

export const api = new ApiClient();
