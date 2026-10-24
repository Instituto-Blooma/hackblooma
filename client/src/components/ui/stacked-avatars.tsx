import { UserBadge, type UserBadgeSize, type UserBadgeUser } from '@/components/ui/user-badge';

const OVERFLOW_BG = '#6b7280';

const SIZE_PX: Record<UserBadgeSize, number> = { sm: 20, md: 24, lg: 28 };

type Props = {
  users: ReadonlyArray<UserBadgeUser>;
  size?: UserBadgeSize;
  max?: number;
};

export function StackedAvatars({ users, size = 'md', max = 3 }: Props) {
  if (users.length === 0) return null;

  const visible = users.slice(0, max);
  const overflow = users.length - visible.length;
  const dim = SIZE_PX[size];
  const overlap = Math.round(dim * 0.35);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        paddingLeft: overlap,
      }}
    >
      {visible.map((u, i) => (
        <span
          key={i}
          style={{
            marginLeft: -overlap,
            borderRadius: '50%',
            boxShadow: '0 0 0 2px var(--background, white)',
            display: 'inline-flex',
          }}
        >
          <UserBadge user={u} size={size} pictureOnly />
        </span>
      ))}
      {overflow > 0 && (
        <span
          title={`+${overflow} more`}
          style={{
            marginLeft: -overlap,
            width: dim,
            height: dim,
            borderRadius: '50%',
            boxShadow: '0 0 0 2px var(--background, white)',
            backgroundColor: OVERFLOW_BG,
            color: 'white',
            fontSize: dim * 0.45,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          +{overflow}
        </span>
      )}
    </span>
  );
}
