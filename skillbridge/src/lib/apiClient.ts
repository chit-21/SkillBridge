// API client utility with Firebase auth token handling
import { getAuth } from "firebase/auth";
import  app  from "./firebase";

export interface ApiError {
  message: string;
  status?: number;
}

async function getAuthToken(): Promise<string | null> {
  try {
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
}

async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  // Use relative URLs for Next.js API routes
  const url = endpoint.startsWith("http") ? endpoint : endpoint;
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response;
}

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetchWithAuth(endpoint, { method: "GET" });
    return response.json();
  },

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetchWithAuth(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  },

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetchWithAuth(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  },

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetchWithAuth(endpoint, { method: "DELETE" });
    return response.json();
  },
};

