import { createFileRoute, redirect } from '@tanstack/react-router';
import { AuthForm } from '@/components/auth-form';
import { validateLoginSearch } from '@/lib/route-guards';

export const Route = createFileRoute('/login')({
  validateSearch: validateLoginSearch,
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ href: search.redirect ?? '/' });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <AuthForm />
    </div>
  );
}
