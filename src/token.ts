function getToken() {
  return process.env.GITHUB_TOKEN;
}
export function getTokenOrExit(): string {
  const token = getToken();
  if (!token) {
    console.error('Error: GITHUB_TOKEN environment variable is not set.');
    process.exit(1);
  }
  return token;
}
