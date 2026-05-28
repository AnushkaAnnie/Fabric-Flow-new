const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface RequestOptions extends RequestInit {
  params?: Record<string, unknown>;
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestOptions,
): Promise<T> {
  let url: URL;
  const baseUrl = API_URL;

  if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
    url = new URL(`${baseUrl}${endpoint}`);
  } else {
    // Relative URL (like /api/backend) needs window.location.origin for construction
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    url = new URL(`${baseUrl}${endpoint}`, origin);
  }

  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message ?? `Request failed with status ${response.status}`);
  }

  return response.json();
}
