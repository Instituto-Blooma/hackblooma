export function AuthLoadingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-background"
      data-testid="auth-loading"
      aria-busy="true"
    />
  );
}
