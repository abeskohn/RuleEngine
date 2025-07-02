import axios, { AxiosResponse, AxiosError } from "axios";
 
// API Configuration
const API_BASE_URL = 'http://localhost:5288';
 
// Types
export interface Condition {
  id?: number;
  condition: string;
  description: string;
  operator: string;
  value: string | number;
  columnName?: string;
  columnId?: number;
  operatorId?: number;
}
 
export interface Operator {
  id: number;
  operator: string;
}
 
export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
}
 
export interface ConditionQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}
 
export interface Column {
  id: number;
  columnName: string;
}
 
export interface ColumnQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}
 
export interface RuleGroup {
  id: string;
  ruleName: string;
  description: string;
  columnName: string;
  value: string;
  conditions: {
    conditionName: string;
    operator: string;
  }[];
  orderNumber: number;
}
 
// API Client
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
 
// Conditions API
export const conditionsApi = {
  // Get all conditions with pagination and sorting
  getConditions: async (params: ConditionQueryParams = {}): Promise<PaginatedResponse<Condition>> => {
    const response = await apiClient.get('/conditions', { params });
    return {
      data: response.data,
      totalCount: parseInt(response.headers['x-total-count'] || '0', 10),
    };
  },
 
  // Get a single condition by ID
  getCondition: async (id: number): Promise<Condition> => {
    const response = await apiClient.get(`/conditions/${id}`);
    return response.data;
  },
 
  // Create a new condition
  createCondition: async (condition: Omit<Condition, 'id'>): Promise<Condition> => {
    const response = await apiClient.post('/conditions', condition);
    return response.data;
  },
 
  // Update an existing condition
  updateCondition: async (id: number, condition: Partial<Condition>): Promise<Condition> => {
    const response = await apiClient.put(`/conditions/${id}`, condition);
    return response.data;
  },
 
  // Delete a condition
  deleteCondition: async (id: number): Promise<void> => {
    await apiClient.delete(`/conditions/${id}`);
  },
 
  // Get available columns
  getAvailableColumns: async (): Promise<string[]> => {
    const response = await apiClient.get('/availableColumns');
    return response.data;
  },
 
  // Get operators
  getOperators: async (): Promise<Operator[]> => {
    const response = await apiClient.get('/operators');
    return response.data;
  },
 
  // Column methods
  getColumns: async (params?: ColumnQueryParams): Promise<PaginatedResponse<Column>> => {
    const response = await apiClient.get('/columns', { params });
    return {
      data: response.data,
      totalCount: 10,//parseInt(response.headers['x-total-count'] || '0', 10),
    };
  },
 
  getColumn: async (id: number): Promise<Column> => {
    const response = await apiClient.get(`/columns/${id}`);
    return response.data;
  },
 
  createColumn: async (column: Omit<Column, 'id'>): Promise<Column> => {
    const response = await apiClient.post('/columns', column);
    return response.data;
  },
 
  updateColumn: async (id: number, column: Partial<Column>): Promise<Column> => {
    const response = await apiClient.put(`/columns/${id}`, column);
    return response.data;
  },
 
  deleteColumn: async (id: number): Promise<void> => {
    await apiClient.delete(`/columns/${id}`);
  },
};
 
// Rule Groups API
export const ruleGroupsApi = {
  getRuleGroups: async ({ page = 1, limit = 10, sort, order }: { page?: number; limit?: number; sort?: string; order?: string }) => {
    const response = await fetch(`${API_BASE_URL}/ruleGroups?page=${page}&limit=${limit}${sort ? `&sort=${sort}` : ''}${order ? `&order=${order}` : ''}`);
    if (!response.ok) throw new Error('Failed to fetch rule groups');
    return response.json();
  },

  createRuleGroup: async (ruleGroup: Omit<RuleGroup, 'id'>) => {
    const response = await fetch(`${API_BASE_URL}/ruleGroups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ruleGroup),
    });
    if (!response.ok) throw new Error('Failed to create rule group');
    return response.json();
  },

  updateRuleGroup: async (id: string, ruleGroup: Omit<RuleGroup, 'id'>) => {
    const response = await fetch(`${API_BASE_URL}/ruleGroups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ruleGroup),
    });
    if (!response.ok) throw new Error('Failed to update rule group');
    return response.json();
  },

  deleteRuleGroup: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/ruleGroups/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete rule group');
    return response.json();
  },
};
 
// Error handling interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors here
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Error-handling interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);
 
export default apiClient;
 
 