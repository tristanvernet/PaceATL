export async function apiRequest(path, { headers, ...options } = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(
      body.error?.message || "The request could not be completed.",
    );
  return body.data;
}
