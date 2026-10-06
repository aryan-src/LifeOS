/**
 * Default local development configuration for Supabase.
 * The ANON key is a valid 3-part HS256 JWT signed with the standard local CLI secret
 * (`super-secret-jwt-token-with-at-least-32-characters-long`) and role 'anon'.
 */
export const DEFAULT_LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321';

export const DEFAULT_LOCAL_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE5OTk5OTk5OTl9.CJRf_9HBUDNd7t0ilkETbuBmLs68GZKD-LFb4krWwe0';
