import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  userId?: string | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  if (userId) {
    headers["x-user-id"] = userId;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  userId?: string;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, userId }) =>
  async ({ queryKey }) => {
    let url = queryKey[0] as string;
    const headers: Record<string, string> = {};
    
    if (userId) {
      headers["x-user-id"] = userId;
      // Also add to query string for GET requests
      try {
        const urlObj = new URL(url, window.location.origin);
        urlObj.searchParams.set("userId", userId);
        url = urlObj.pathname + urlObj.search;
      } catch {
        // If URL construction fails, just use the original URL
        // The header will still be sent
      }
    }
    
    const res = await fetch(url, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Helper to get query function with user ID
export const getQueryFnWithUserId = (userId: string) => {
  return getQueryFn({ on401: "throw", userId });
};
