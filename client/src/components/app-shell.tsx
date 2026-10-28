import type { ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import {
  Bell,
  CalendarDays,
  GraduationCap,
  HeartHandshake,
  ListChecks,
  LogOut,
  Medal,
  Settings2,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { toast } from 'sonner';
import { BloomaWordmark } from '@/components/blooma-brand';
import { ImpersonationBanner } from '@/components/impersonation-banner';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { api } from '../../../convex/_generated/api';

type NavItem = { to: string; label: string; icon: typeof Sparkles; exact?: boolean };

const MENINA_NAV: NavItem[] = [
  { to: '/', label: 'Próximos passos', icon: Sparkles, exact: true },
  { to: '/calendario', label: 'Calendário', icon: CalendarDays },
  { to: '/olimpiadas', label: 'Olimpíadas', icon: Trophy },
  { to: '/historico', label: 'Histórico', icon: Medal },
];

const EQUIPE_NAV: NavItem[] = [
  { to: '/equipe', label: 'Acompanhamento', icon: HeartHandshake, exact: true },
  { to: '/equipe/lista', label: 'Lista oficial', icon: ListChecks },
  { to: '/olimpiadas', label: 'Olimpíadas', icon: Trophy },
  { to: '/calendario', label: 'Calendário', icon: CalendarDays },
];

function useIsActive() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (item: NavItem) =>
    item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);
}

function AvisosBell() {
  const avisos = useQuery(api.avisos.listMine);
  const markAllRead = useMutation(api.avisos.markAllRead);
  const unread = avisos?.filter((aviso) => !aviso.read).length ?? 0;

  return (
    <Popover
      onOpenChange={(open) => {
        if (!open && unread > 0) {
          void markAllRead();
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="button-avisos">
          <Bell />
          {unread > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unread}
            </span>
          ) : null}
          <span className="sr-only">Avisos</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <p className="font-serif text-base font-semibold">Avisos</p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {avisos && avisos.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nenhum aviso por enquanto. Eles chegam quando um prazo ou uma prova estiver perto.
            </p>
          ) : null}
          {avisos?.map((aviso) => (
            <Link
              key={aviso._id}
              to="/olimpiadas/$olympiadId"
              params={{ olympiadId: aviso.olympiadId }}
              className={cn(
                'block border-b px-4 py-3 text-sm last:border-b-0 hover:bg-muted',
                !aviso.read && 'bg-accent/40'
              )}
            >
              <p className="font-medium">{aviso.title}</p>
              <p className="mt-0.5 text-muted-foreground">{aviso.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(aviso.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AppShell({ children }: { readonly children: ReactNode }) {
  const { signOut } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.olimpiadas.me, isAuthenticated ? {} : 'skip');
  const isPlatformAdmin = useQuery(
    api.platform.isCurrentUserPlatformAdmin,
    isAuthenticated ? {} : 'skip'
  );
  const isActive = useIsActive();
  const nav = me?.isEquipe ? EQUIPE_NAV : MENINA_NAV;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Até logo!');
    } catch {
      toast.error('Não foi possível sair');
    }
  };

  const displayName = me?.name ?? 'Você';
  const avatarFallback = displayName.charAt(0).toUpperCase() || 'B';

  return (
    <div className="flex min-h-screen flex-col">
      <ImpersonationBanner />
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-6">
            <Link to={me?.isEquipe ? '/equipe' : '/'}>
              <BloomaWordmark compact />
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {nav.map((item) => (
                <Link key={item.to} to={item.to}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(isActive(item) && 'bg-accent text-accent-foreground')}
                  >
                    <item.icon />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-1">
            <AvisosBell />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full"
                  data-testid="button-user-menu"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={me?.image ?? undefined} />
                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{me?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/perfil">
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Perfil escolar e avisos
                  </Link>
                </DropdownMenuItem>
                {me?.isEquipe ? (
                  <DropdownMenuItem asChild>
                    <Link to="/settings/members">
                      <Settings2 className="mr-2 h-4 w-4" />
                      Convidar meninas
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                {isPlatformAdmin ? (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" data-testid="nav-platform-admin">
                      <Settings2 className="mr-2 h-4 w-4" />
                      Administração
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} data-testid="menu-signout">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container flex-1 px-4 pb-24 pt-6 md:px-6 md:pb-10 md:pt-8">{children}</main>

      <footer className="hidden border-t py-4 md:block">
        <div className="container px-4 md:px-6">
          <p className="text-center text-sm text-muted-foreground">
            Instituto Blooma · Meninas fazendo o futuro
          </p>
        </div>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {nav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'flex flex-col items-center gap-1 py-2 text-[11px] font-medium text-muted-foreground',
              isActive(item) && 'text-primary'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
