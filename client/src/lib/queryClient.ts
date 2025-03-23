import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

interface ApiRequestOptions {
  method: string;
  url: string;
  body?: unknown;
}

interface AuthOptions {
  on401: UnauthorizedBehavior;
}

// Define function overloads for better type checking
export async function apiRequest(method: string, url: string, data?: unknown): Promise<any>;
export async function apiRequest(options: ApiRequestOptions, authOptions?: AuthOptions): Promise<any>;
export async function apiRequest(...args: any[]): Promise<any> {
  let method: string;
  let url: string;
  let data: unknown | undefined;
  let unauthorizedBehavior: UnauthorizedBehavior = 'throw';
  
  // Check if the first argument is an object (new style) or a string (old style)
  if (typeof args[0] === 'object' && !Array.isArray(args[0])) {
    const options = args[0] as ApiRequestOptions;
    method = options.method;
    url = options.url;
    data = options.body;
    
    // Check if the second argument exists and has on401
    if (args[1] && typeof args[1] === 'object' && 'on401' in args[1]) {
      unauthorizedBehavior = (args[1] as AuthOptions).on401;
    }
  } else {
    // Old style: (method, url, data?)
    method = args[0] as string;
    url = args[1] as string;
    data = args[2];
  }

  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (unauthorizedBehavior === "returnNull" && res.status === 401) {
    return null;
  }

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
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
