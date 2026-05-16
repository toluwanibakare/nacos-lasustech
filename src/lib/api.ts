const rawApiUrl = import.meta.env.VITE_API_URL;
export const API_BASE_URL = (rawApiUrl && rawApiUrl !== "undefined" && rawApiUrl !== "") 
  ? rawApiUrl 
  : 'https://api.nacos.tmb.it.com/api';

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};
