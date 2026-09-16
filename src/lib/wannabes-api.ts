import { createWannabesClient } from './rest-client';

// These are private variables: no PUBLIC_ prefix and no client-side imports.
export const wannabesApi = createWannabesClient({
  baseUrl: process.env.WANNABES_API_URL || import.meta.env?.WANNABES_API_URL,
  apiKey: process.env.WANNABES_API_KEY || import.meta.env?.WANNABES_API_KEY,
});
