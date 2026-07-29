const url = process.env.HEALTHCHECK_URL ?? 'http://localhost:3000/api/health';
const response = await fetch(url);
if (!response.ok) {
  throw new Error(`Healthcheck falhou: ${response.status}`);
}
console.log(await response.json());
