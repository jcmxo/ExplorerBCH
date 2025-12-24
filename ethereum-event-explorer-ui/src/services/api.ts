/**
 * Base URL for the backend API.
 * 
 * Configuration:
 * - In Docker: Set via docker-compose.yml as NEXT_PUBLIC_API_URL=http://backend:3000
 *   (uses Docker service name 'backend' for internal network communication)
 * - Outside Docker: Set in .env.local as NEXT_PUBLIC_API_URL=http://localhost:4000
 *   (uses host port where backend is exposed)
 * 
 * Fallback: http://localhost:4000 (for local development outside Docker)
 */
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');

/**
 * ApiError represents an error from the API.
 * It does NOT expose the Response object to prevent re-reading the response body.
 * All error information is contained in the message string.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Fetches data from the backend API.
 * 
 * IMPORTANT: This is the ONLY function that reads the response body.
 * The body is consumed exactly once using response.text().
 * 
 * @param endpoint - API endpoint path (must start with '/', e.g., '/rpcs')
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Promise resolving to the parsed response data
 * @throws ApiError if the request fails or response is not ok
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  // Ensure endpoint starts with '/' and API_BASE_URL doesn't end with '/'
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (error) {
    throw new ApiError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // IMPORTANT: Fetch response body can only be consumed once.
  // We read it exactly once as text, then parse manually if needed.
  // Never call response.json() or response.text() more than once.
  // This is the ONLY place in the entire application where response.text() is called.
  const raw = await response.text();

  if (!response.ok) {
    // Build a complete error message that includes all relevant information
    let errorMessage = `API Error (${response.status}): ${response.statusText}`;
    
    if (raw.trim()) {
      try {
        const errorData = JSON.parse(raw);
        // Try to extract a meaningful error message from the JSON response
        if (typeof errorData === 'object' && errorData !== null) {
          if (errorData.message) {
            errorMessage = `${errorMessage}. ${errorData.message}`;
          } else if (errorData.error) {
            errorMessage = `${errorMessage}. ${errorData.error}`;
          } else {
            // Include the full error data as JSON string for debugging
            errorMessage = `${errorMessage}. Details: ${JSON.stringify(errorData)}`;
          }
        } else if (typeof errorData === 'string') {
          errorMessage = `${errorMessage}. ${errorData}`;
        }
      } catch {
        // If JSON parsing fails, try to extract useful info from HTML responses
        if (raw.trim().startsWith('<!DOCTYPE') || raw.trim().startsWith('<html')) {
          // Extract text from <pre> tags or <body> content
          const preMatch = raw.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
          if (preMatch) {
            errorMessage = `${errorMessage}. ${preMatch[1].trim()}`;
          } else {
            // Try to extract text from body
            const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            if (bodyMatch) {
              // Remove HTML tags and get text content
              const textContent = bodyMatch[1].replace(/<[^>]+>/g, ' ').trim();
              if (textContent && textContent.length <= 200) {
                errorMessage = `${errorMessage}. ${textContent}`;
              } else if (textContent) {
                errorMessage = `${errorMessage}. ${textContent.substring(0, 200)}...`;
              }
            } else {
              // Fallback: just mention it's an HTML response
              errorMessage = `${errorMessage}. Server returned HTML instead of JSON`;
            }
          }
        } else {
          // Plain text response
          if (raw.length <= 200) {
            errorMessage = `${errorMessage}. ${raw}`;
          } else {
            errorMessage = `${errorMessage}. ${raw.substring(0, 200)}...`;
          }
        }
      }
    }
    
    throw new ApiError(errorMessage, response.status);
  }

  // Parse successful response
  if (raw.trim()) {
    try {
      return JSON.parse(raw) as T;
    } catch {
      // If JSON parsing fails for a successful response, return empty object
      return {} as T;
    }
  }

  return {} as T;
}

// Dashboard API
export const dashboardApi = {
  getMetrics: () =>
    fetchApi<import('../types/dashboard').DashboardData>('/dashboard'),
};

// RPCs API
export const rpcsApi = {
  getAll: () =>
    // Backend returns array [{id, name, url}, ...] but type allows RpcListResponse for compatibility
    fetchApi<import('../types/rpc').Rpc[] | import('../types/rpc').RpcListResponse>('/rpcs'),

  getById: (id: number) =>
    fetchApi<import('../types/rpc').Rpc>(`/rpcs/${id}`),

  create: (data: import('../types/rpc').CreateRpcRequest) =>
    fetchApi<import('../types/rpc').Rpc>('/rpcs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: import('../types/rpc').UpdateRpcRequest) =>
    fetchApi<import('../types/rpc').Rpc>(`/rpcs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchApi<void>(`/rpcs/${id}`, {
      method: 'DELETE',
    }),

  activate: (id: number) =>
    fetchApi<import('../types/rpc').Rpc>(`/rpcs/${id}/activate`, {
      method: 'POST',
    }),

  deactivate: (id: number) =>
    fetchApi<import('../types/rpc').Rpc>(`/rpcs/${id}/deactivate`, {
      method: 'POST',
    }),
};

// Events API
export const eventsApi = {
  getAll: (filters?: import('../types/event').EventsFilters) => {
    const params = new URLSearchParams();

    if (filters?.contractAddress) {
      params.append('contractAddress', filters.contractAddress);
    }
    if (filters?.eventName) {
      params.append('eventName', filters.eventName);
    }
    if (filters?.startBlock) {
      params.append('startBlock', filters.startBlock.toString());
    }
    if (filters?.endBlock) {
      params.append('endBlock', filters.endBlock.toString());
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    if (filters?.pageSize) {
      params.append('pageSize', filters.pageSize.toString());
    }

    const queryString = params.toString();
    const endpoint = `/events${queryString ? `?${queryString}` : ''}`;

    return fetchApi<import('../types/event').EventsResponse>(endpoint);
  },
};
