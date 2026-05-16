const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

const DEFAULT_TIMEOUT_MS = 8000;

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.details = options.details;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseResponseBody(response) {
  const contentType = response.headers.get("content-type");

  if (!contentType || !contentType.includes("application/json")) {
    return null;
  }

  return response.json();
}

async function request(path, options = {}) {
  const {
    method = "GET",
    body,
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = method === "GET" ? 2 : 0,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
          Accept: "application/json",
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseBody = await parseResponseBody(response);

      if (!response.ok) {
        throw new ApiError(responseBody?.message || "Request failed", {
          status: response.status,
          details: responseBody,
        });
      }

      return responseBody;
    } catch (error) {
      clearTimeout(timeoutId);

      lastError = error;

      const shouldRetry =
        attempt < retries &&
        (error.name === "AbortError" ||
          error instanceof TypeError ||
          error.status >= 500 ||
          error.status === 429);

      if (!shouldRetry) {
        throw error;
      }

      await sleep(300 * (attempt + 1));
    }
  }

  throw lastError;
}

export function fetchProducts() {
  return request("/api/products/");
}

export function searchProducts(query) {
  return request(`/api/products/search?q=${encodeURIComponent(query)}`);
}

export function createOrder(payload, idempotencyKey) {
  return request("/api/orders/", {
    method: "POST",
    body: payload,
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
  });
}

export function fetchOrder(orderId) {
  return request(`/api/orders/${orderId}`);
}
