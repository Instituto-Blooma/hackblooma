import {
  addComposerChild$,
  BoldItalicUnderlineToggles,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  type MDXEditorMethods,
  quotePlugin,
  realmPlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from '@mdxeditor/editor';
// Side-effect CSS import required by MDXEditor.
// oxlint-disable-next-line import/no-unassigned-import
import '@mdxeditor/editor/style.css';
import { LexicalCollabBinding } from '@talentum-ventures/convex-presence/lexical';
import {
  useCollabDoc,
  type CollabDocResult,
  type CollabProvider,
} from '@talentum-ventures/convex-presence/react';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { useEffect, useMemo, useRef, useState, type MutableRefObject, type RefObject } from 'react';
import { api } from '../../../../../convex/_generated/api';
import { presenceRoomForDocument } from '../../../../../convex/lib/collabIds';
import { StackedAvatars } from '@/components/ui/stacked-avatars';
import { cn } from '@/lib/utils';

const MARKDOWN_SNAPSHOT_DEBOUNCE_MS = 750;
const FACEPILE_MAX = 3;

type CollabPluginParams = {
  documentId: string;
  doc: CollabDocResult['doc'];
  provider: CollabProvider;
  username: string;
  cursorColor: string;
  shouldBootstrap?: boolean;
};

const richTextCollabPlugin = realmPlugin<CollabPluginParams>({
  init(realm, params) {
    if (!params) {
      return;
    }

    const { documentId, doc, provider, username, cursorColor, shouldBootstrap = true } = params;

    realm.pub(addComposerChild$, () => (
      <LexicalCollabBinding
        documentId={documentId}
        doc={doc}
        provider={provider}
        username={username}
        cursorColor={cursorColor}
        shouldBootstrap={shouldBootstrap}
      />
    ));
  },
});

type RichTextFacepilePeer = {
  userId: string;
  name: string;
  color: string;
};

type CollabToolbarContentsProps = {
  peers: ReadonlyArray<RichTextFacepilePeer>;
  'data-testid'?: string;
};

function CollabToolbarContents({ peers, 'data-testid': dataTestId }: CollabToolbarContentsProps) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
      <BoldItalicUnderlineToggles />
      {peers.length > 0 ? (
        <div
          className="shrink-0"
          data-testid={dataTestId}
          aria-label={`${peers.length} collaborator${peers.length === 1 ? '' : 's'} editing`}
        >
          <StackedAvatars
            users={peers.map((peer) => ({
              name: peer.name,
              color: peer.color,
            }))}
            size="md"
            max={FACEPILE_MAX}
          />
        </div>
      ) : null}
    </div>
  );
}

type CypressMdxEditorApi = {
  setMarkdown: (markdown: string) => void;
};

type CypressWindow = Window & {
  Cypress?: unknown;
  __mdxEditors?: Record<string, CypressMdxEditorApi>;
};

function useRegisterMdxEditorForCypress(
  dataTestId: string | undefined,
  editorRef: RefObject<MDXEditorMethods | null>,
  onChange: (markdown: string) => void,
  lastEmittedRef: MutableRefObject<string>
) {
  useEffect(() => {
    if (!dataTestId) {
      return;
    }
    const win = window as CypressWindow;
    if (!win.Cypress) {
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 60;

    const register = () => {
      if (cancelled) {
        return;
      }
      if (editorRef.current) {
        win.__mdxEditors ??= {};
        win.__mdxEditors[dataTestId] = {
          setMarkdown: (markdown: string) => {
            editorRef.current?.setMarkdown(markdown);
            lastEmittedRef.current = markdown;
            onChange(markdown);
          },
        };
        return;
      }
      attempts += 1;
      if (attempts < maxAttempts) {
        window.requestAnimationFrame(register);
      }
    };

    register();
    return () => {
      cancelled = true;
      delete win.__mdxEditors?.[dataTestId];
    };
  }, [dataTestId, editorRef, lastEmittedRef, onChange]);
}

function FormToolbarContents() {
  return (
    <>
      <UndoRedo />
      <BoldItalicUnderlineToggles />
    </>
  );
}

export type RichTextCollabUser = {
  userId: string;
  name: string;
  color?: string;
};

export type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  isDark?: boolean;
  'data-testid'?: string;
  collab?: {
    documentId: string;
    user: RichTextCollabUser;
  };
};

function useIsDarkClass(isDark?: boolean): boolean {
  if (typeof isDark === 'boolean') {
    return isDark;
  }
  if (typeof document === 'undefined') {
    return false;
  }
  return document.documentElement.classList.contains('dark');
}

function peerDisplayName(data: Record<string, unknown>, userId: string): string {
  if (typeof data.name === 'string' && data.name.trim()) {
    return data.name;
  }
  return userId;
}

function peerColor(data: Record<string, unknown>, fallback: string): string {
  if (typeof data.color === 'string' && data.color.trim()) {
    return data.color;
  }
  return fallback;
}

function RichTextCollabEditor({
  onChange,
  onBlur,
  disabled,
  placeholder,
  className,
  isDark,
  'data-testid': dataTestId,
  collab,
}: RichTextEditorProps & { collab: NonNullable<RichTextEditorProps['collab']> }) {
  const editorRef = useRef<MDXEditorMethods>(null);
  const snapshotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmittedRef = useRef('');
  const dark = useIsDarkClass(isDark);
  const { isAuthenticated } = useConvexAuth();
  const saveMarkdownSnapshot = useMutation(api.collab.saveMarkdownSnapshot);
  const cursorColor = collab.user.color ?? '#2563eb';
  useRegisterMdxEditorForCypress(dataTestId, editorRef, onChange, lastEmittedRef);

  const { doc, provider } = useCollabDoc({
    apis: { sync: api.collab, presence: api.collab },
    documentId: collab.documentId,
    user: {
      userId: collab.user.userId,
      name: collab.user.name,
      color: cursorColor,
    },
  });

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(timer);
  }, []);

  const peers = useQuery(
    api.collab.list,
    isAuthenticated ? { room: presenceRoomForDocument(collab.documentId), now } : 'skip'
  );
  const syncHead = useQuery(
    api.collab.getSyncHead,
    isAuthenticated ? { documentId: collab.documentId } : 'skip'
  );

  const facepilePeers = useMemo<RichTextFacepilePeer[]>(() => {
    if (!peers) {
      return [];
    }
    const byUserId = new Map<string, RichTextFacepilePeer>();
    for (const peer of peers) {
      if (peer.userId === collab.user.userId || byUserId.has(peer.userId)) {
        continue;
      }
      const data = (peer.data ?? {}) as Record<string, unknown>;
      byUserId.set(peer.userId, {
        userId: peer.userId,
        name: peerDisplayName(data, peer.userId),
        color: peerColor(data, '#64748b'),
      });
    }
    return [...byUserId.values()];
  }, [collab.user.userId, peers]);

  const facepileTestId = dataTestId ? `${dataTestId}-facepile` : undefined;

  const plugins = useMemo(
    () => [
      headingsPlugin(),
      listsPlugin(),
      quotePlugin(),
      thematicBreakPlugin(),
      linkPlugin(),
      linkDialogPlugin(),
      markdownShortcutPlugin(),
      toolbarPlugin({
        toolbarContents: () => (
          <CollabToolbarContents peers={facepilePeers} data-testid={facepileTestId} />
        ),
      }),
      richTextCollabPlugin({
        documentId: collab.documentId,
        doc,
        provider,
        username: collab.user.name,
        cursorColor,
        shouldBootstrap: true,
      }),
    ],
    [collab.documentId, collab.user.name, cursorColor, doc, facepilePeers, facepileTestId, provider]
  );

  useEffect(() => {
    return () => {
      if (snapshotTimerRef.current !== null) {
        clearTimeout(snapshotTimerRef.current);
      }
    };
  }, []);

  const handleChange = (next: string) => {
    lastEmittedRef.current = next;
    onChange(next);

    if (snapshotTimerRef.current !== null) {
      clearTimeout(snapshotTimerRef.current);
    }
    snapshotTimerRef.current = setTimeout(() => {
      snapshotTimerRef.current = null;
      void saveMarkdownSnapshot({
        documentId: collab.documentId,
        markdown: next,
      });
    }, MARKDOWN_SNAPSHOT_DEBOUNCE_MS);
  };

  return (
    <div
      className={cn(
        'rounded-md border border-input bg-background',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      data-testid={dataTestId}
      data-sync-version={syncHead?.version ?? 0}
      onBlur={onBlur}
    >
      <MDXEditor
        ref={editorRef}
        markdown=""
        editorState={null}
        suppressSharedHistory
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(dark && 'dark-theme')}
        contentEditableClassName="prose dark:prose-invert max-w-none min-h-[160px] px-3 py-2"
        plugins={plugins}
      />
    </div>
  );
}

function markdownEchoEqual(a: string, b: string): boolean {
  // MDXEditor export appends a trailing newline; controlled parents often store a trimmed copy.
  return a.trim() === b.trim();
}

function RichTextFormEditor({
  value,
  onChange,
  onBlur,
  disabled,
  placeholder,
  className,
  isDark,
  'data-testid': dataTestId,
}: Omit<RichTextEditorProps, 'collab'>) {
  const editorRef = useRef<MDXEditorMethods>(null);
  const lastEmittedRef = useRef(value);
  const valueRef = useRef(value);
  const focusedRef = useRef(false);
  const dark = useIsDarkClass(isDark);
  useRegisterMdxEditorForCypress(dataTestId, editorRef, onChange, lastEmittedRef);

  valueRef.current = value;

  useEffect(() => {
    // Form-mode is write-through while focused: never setMarkdown for local echoes
    // (trailing newlines from MDX export), or caret jumps to rootStart.
    if (focusedRef.current) {
      return;
    }
    if (markdownEchoEqual(value, lastEmittedRef.current)) {
      lastEmittedRef.current = value;
      return;
    }
    editorRef.current?.setMarkdown(value);
    lastEmittedRef.current = value;
  }, [value]);

  const plugins = useMemo(
    () => [
      headingsPlugin(),
      listsPlugin(),
      quotePlugin(),
      thematicBreakPlugin(),
      linkPlugin(),
      linkDialogPlugin(),
      markdownShortcutPlugin(),
      toolbarPlugin({
        toolbarContents: FormToolbarContents,
      }),
    ],
    []
  );

  return (
    <div
      className={cn(
        'rounded-md border border-input bg-background',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      data-testid={dataTestId}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) {
          return;
        }
        focusedRef.current = false;
        // Apply any external prop update that arrived while focused.
        const incoming = valueRef.current;
        if (markdownEchoEqual(incoming, lastEmittedRef.current)) {
          lastEmittedRef.current = incoming;
        } else {
          editorRef.current?.setMarkdown(incoming);
          lastEmittedRef.current = incoming;
        }
        onBlur?.();
      }}
    >
      <MDXEditor
        ref={editorRef}
        markdown={value}
        onChange={(next) => {
          lastEmittedRef.current = next;
          onChange(next);
        }}
        placeholder={placeholder}
        className={cn(dark && 'dark-theme')}
        contentEditableClassName="prose dark:prose-invert max-w-none min-h-[160px] px-3 py-2"
        plugins={plugins}
      />
    </div>
  );
}

export default function RichTextEditor(props: RichTextEditorProps) {
  if (props.collab) {
    return <RichTextCollabEditor {...props} collab={props.collab} />;
  }
  return <RichTextFormEditor {...props} />;
}
