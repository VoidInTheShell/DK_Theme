import { apiClient } from "@/lib/api/client";
const usageApi = {
  async get<T>(path: string, query?: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
    const response = await apiClient.get("/api/v1/user/" + path, { params: query, signal });
    return response.data.data;
  },
  async post<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    const response = await apiClient.post("/api/v1/user/" + path, body, { signal });
    return response.data.data;
  },
};
export function useUsageApi() { return usageApi; }
