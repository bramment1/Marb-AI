export async function call<T>(method: string, params?: unknown): Promise<T> {
  const res = await fetch('http://localhost:12345', {
    method: 'POST',
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    headers: { 'Content-Type': 'application/json' }
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result as T;
}
