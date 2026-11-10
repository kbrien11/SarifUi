
const API_URL = "http://127.0.0.1:8001/api";

// Types

export interface Plan {
  plan_key: string;
  plan_name?: string;
  name?: string;
  state?: string;
  plan_id?: string;
  in_network_files?: { url: string }[];
}

export interface IngestionStatus {
  status: "pending" | "processing" | "completed" | "failed";
  records_processed: number;
  error_message?: string;
}

export interface NegotiatedPrice {
  negotiated_rate?: number;
  negotiated_type?: string;
  expiration_date?: string;
  billing_class?: string;
  service_code?: string[];
  additional_information?: string;
}

export interface NegotiatedRateGroup {
  provider_references?: number[];
  negotiated_prices?: NegotiatedPrice[];
}

export interface RateRecord {
  billing_code: string;
  billing_code_type: string;
  description: string;
  negotiated_rates: NegotiatedRateGroup[];
}

export interface SearchResponse {
  unique_billing_codes: number;
  total_negotiated_rates: number;
  results: RateRecord[];
}

// Helper for handling API responses

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data as T;
}

// Get available insurance plans

export async function fetchPlans(): Promise<Plan[]> {
  const response = await fetch(`${API_URL}/in-network-files/`);

  const data = await handleResponse<any>(response);

  return Array.isArray(data)
    ? data
    : data.results ?? data.plans ?? [];
}

// Get ingestion status for a selected plan

export async function fetchIngestionStatus(
  planKey: string
): Promise<IngestionStatus | null> {
  const response = await fetch(
    `${API_URL}/plans/${encodeURIComponent(planKey)}/data/`
  );

  if (response.status === 404) {
    return null;
  }

  return handleResponse<IngestionStatus>(response);
}

// Trigger plan ingestion

export async function ingestPlan(planKey: string): Promise<void> {
  const response = await fetch(
    `${API_URL}/plans/${encodeURIComponent(planKey)}/`,
    { method: "GET" }
  );

  await handleResponse<any>(response);
}

// Search negotiated rates

export async function searchPlanRecords(
  planKey: string,
  filters: {
    billingCode?: string;
    description?: string;
  }
): Promise<SearchResponse> {
  const params = new URLSearchParams();

  if (filters.billingCode?.trim()) {
    params.set("billing_code", filters.billingCode.trim());
  }

  if (filters.description?.trim()) {
    params.set("description", filters.description.trim());
  }

  const response = await fetch(
    `${API_URL}/plans/${encodeURIComponent(planKey)}/search/?${params}`
  );

  return handleResponse<SearchResponse>(response);
}
