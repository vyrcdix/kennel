import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from './Icon';
import { Mono } from './Mono';
import {
  createProject,
  SlugConflictError,
  ValidationError,
} from '../data/actions';
import { getProjects } from '../data/selectors';
import { deriveSlug, isValidSlug } from '../data/slug';
import type { ProjectColor } from '../data/types';

const NAME_MAX = 80;
const DESCRIPTION_MAX = 140;
const CONTEXT_SOFT = 2000;
const CONTEXT_HARD = 8000;

/** v0.5 §A thread label palette. The family-language tokens
 *  (blaze/ember/moss/clay) are deliberately not selectable here. */
const COLORS: { name: 'none' | ProjectColor; hex: string }[] = [
  { name: 'none',  hex: 'transparent' },
  { name: 'stone', hex: 'var(--tint-stone)' },
  { name: 'sage',  hex: 'var(--tint-sage)' },
  { name: 'dusk',  hex: 'var(--tint-dusk)' },
  { name: 'plum',  hex: 'var(--tint-plum)' },
  { name: 'slate', hex: 'var(--tint-slate)' },
  { name: 'teal',  hex: 'var(--tint-teal)' },
];

type FocusField = 'name' | 'slug' | 'description' | 'context' | null;

const FieldLabel = ({
  children,
  required,
  hint,
}: {
  children: ReactNode;
  required?: boolean;
  hint?: ReactNode;
}) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
    <span className="km-display-sm" style={{ fontSize: 11, letterSpacing: '.18em' }}>
      {children}
    </span>
    {required && (
      <span
        className="km-mono-sm"
        style={{ color: 'var(--ember-deep)', fontSize: 10 }}
      >
        required
      </span>
    )}
    {hint && <span style={{ flex: 1 }} />}
    {hint && (
      <span
        className="km-body-sm"
        style={{ fontSize: 11, color: 'var(--fg-faint)' }}
      >
        {hint}
      </span>
    )}
  </div>
);

const ColorSwatch = ({
  name,
  hex,
  selected,
  onClick,
}: {
  name: 'none' | ProjectColor;
  hex: string;
  selected: boolean;
  onClick: () => void;
}) => {
  const isNone = name === 'none';
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 0,
        padding: 0,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 4,
          background: isNone ? 'transparent' : hex,
          border: selected
            ? '2px solid var(--ember)'
            : isNone
            ? '1px dashed var(--line-strong)'
            : '1px solid var(--line)',
          boxShadow: selected ? '0 0 0 3px color-mix(in srgb, var(--action) 18%, transparent)' : 'none',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isNone && (
          <span
            className="km-mono-sm"
            style={{ color: 'var(--fg-faint)', fontSize: 9, letterSpacing: '.06em' }}
          >
            NONE
          </span>
        )}
        {selected && !isNone && (
          <span
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: 'var(--ember)',
              color: 'var(--bone)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 6 2 2 4-4" />
            </svg>
          </span>
        )}
      </div>
      <span
        className="km-mono-sm"
        style={{
          fontSize: 10,
          color: selected ? 'var(--ember-deep)' : 'var(--fg-faint)',
        }}
      >
        {name}
      </span>
    </button>
  );
};

const MiniToggle = ({
  on,
  onClick,
}: {
  on: boolean;
  onClick: () => void;
}) => (
  <span
    onClick={onClick}
    style={{
      display: 'inline-block',
      width: 32,
      height: 18,
      borderRadius: 9,
      background: on ? 'var(--moss)' : 'var(--surface-2)',
      position: 'relative',
      cursor: 'pointer',
      flex: '0 0 auto',
    }}
  >
    <span
      style={{
        position: 'absolute',
        top: 2,
        left: on ? 16 : 2,
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: 'var(--surface-0)',
        transition: 'left .15s ease',
      }}
    />
  </span>
);

export type CreateProjectModalProps = {
  open: boolean;
  onClose: () => void;
  mobile?: boolean;
  /** When invoked from inside a registered Claude chat, pass the chat id to
   *  surface the "Register this chat" affordance pre-checked. Hidden otherwise. */
  currentChatId?: string;
};

export const CreateProjectModal = ({
  open,
  onClose,
  mobile = false,
  currentChatId,
}: CreateProjectModalProps) => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [context, setContext] = useState('');
  const [contextOpen, setContextOpen] = useState(false);
  const [color, setColor] = useState<'none' | ProjectColor>('none');
  const [pinned, setPinned] = useState(false);
  const [registerChat, setRegisterChat] = useState(!!currentChatId);
  const [focusField, setFocusField] = useState<FocusField>('name');
  const [slugError, setSlugError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const slugRef = useRef<HTMLInputElement>(null);
  const contextRef = useRef<HTMLTextAreaElement>(null);

  // Reset on open
  useEffect(() => {
    if (!open) return;
    setName('');
    setSlug('');
    setSlugTouched(false);
    setDescription('');
    setContext('');
    setContextOpen(false);
    setColor('none');
    setPinned(false);
    setRegisterChat(!!currentChatId);
    setSlugError(null);
    setNameError(null);
    setNetworkError(null);
    setSubmitting(false);
    setFocusField('name');
    queueMicrotask(() => nameRef.current?.focus());
  }, [open, currentChatId]);

  // Live slug derivation while user hasn't manually edited the slug.
  useEffect(() => {
    if (slugTouched) return;
    setSlug(deriveSlug(name));
  }, [name, slugTouched]);

  // Keyboard: Esc closes; Enter submits (Cmd/Ctrl+Enter inside context).
  const submitRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      const target = e.target as HTMLElement | null;
      const inTextarea = target?.tagName === 'TEXTAREA';
      if (e.key === 'Enter') {
        if (inTextarea && !(e.metaKey || e.ctrlKey)) return;
        e.preventDefault();
        submitRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const canSubmit = useMemo(
    () => name.trim().length > 0 && isValidSlug(slug) && !submitting,
    [name, slug, submitting],
  );

  const submit = async () => {
    if (!canSubmit) {
      if (!name.trim()) {
        setNameError('Name is required.');
        nameRef.current?.focus();
      }
      if (!isValidSlug(slug)) {
        setSlugError('Slug must be lowercase letters, digits, and single hyphens.');
        slugRef.current?.focus();
      }
      return;
    }
    setSubmitting(true);
    setNetworkError(null);
    try {
      const created = await createProject({
        name: name.trim(),
        slug,
        description: description.trim() || undefined,
        context: context.trim() || undefined,
        color: color === 'none' ? null : color,
        pinned,
      });
      onClose();
      navigate(`/project/${created.slug}`);
    } catch (err) {
      setSubmitting(false);
      if (err instanceof SlugConflictError) {
        setSlugError(`Slug already used by ${err.conflictingProject.name}`);
        slugRef.current?.focus();
      } else if (err instanceof ValidationError) {
        if (err.fields.name) setNameError('Name is required.');
        if (err.fields.slug) setSlugError('Slug format invalid.');
      } else {
        setNetworkError(`Could not create thread. ${(err as Error).message}`);
      }
    }
  };
  submitRef.current = submit;

  if (!open) return null;

  const slugConflictSurfaced = !!slugError;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'color-mix(in srgb, var(--scrim) 28%, transparent)',
        display: 'flex',
        alignItems: mobile ? 'stretch' : 'flex-start',
        justifyContent: 'center',
        paddingTop: mobile ? 0 : 64,
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: mobile ? '100%' : 480,
          maxWidth: '100%',
          background: 'var(--surface-0)',
          border: mobile ? 'none' : '1px solid var(--line-strong)',
          borderRadius: mobile ? 0 : 6,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          maxHeight: mobile ? '100%' : 'calc(100vh - 96px)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: mobile ? '14px 18px' : '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--line)',
            flex: '0 0 auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="km-display-sm" style={{ fontSize: mobile ? 13 : 12 }}>
              NEW THREAD
            </span>
            {!mobile && <Mono dim>⌘⇧N</Mono>}
          </div>
          <button
            className="km-btn km-btn-ghost"
            onClick={onClose}
            style={{ padding: '4px 6px', color: 'var(--fg-muted)' }}
          >
            <Icons.x size={16} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: mobile ? '18px 18px 24px' : '20px 22px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: mobile ? 18 : 16,
            flex: 1,
            overflow: 'auto',
          }}
        >
          {/* Name */}
          <div>
            <FieldLabel required>Name</FieldLabel>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => {
                setName(e.target.value.slice(0, NAME_MAX));
                setNameError(null);
              }}
              onFocus={() => setFocusField('name')}
              onBlur={() => setFocusField(null)}
              placeholder="Picnic — Engagement"
              maxLength={NAME_MAX}
              style={{
                width: '100%',
                padding: '9px 12px',
                background: 'var(--surface-1)',
                border: nameError
                  ? '1px solid var(--ember-deep)'
                  : focusField === 'name'
                  ? '1px solid var(--ember)'
                  : '1px solid var(--line)',
                boxShadow:
                  focusField === 'name' && !nameError
                    ? '0 0 0 3px color-mix(in srgb, var(--action) 18%, transparent)'
                    : 'none',
                borderRadius: 4,
                fontFamily: 'var(--ff-sans)',
                fontWeight: 500,
                fontSize: 16,
                lineHeight: 1.3,
                color: 'var(--fg)',
                outline: 'none',
              }}
            />
            {nameError && (
              <div
                className="km-mono-sm"
                style={{ marginTop: 6, color: 'var(--ember-deep)' }}
              >
                {nameError}
              </div>
            )}

            {/* Slug */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 10,
                marginTop: 8,
                paddingLeft: 2,
              }}
            >
              <span className="km-mono-sm" style={{ color: 'var(--fg-faint)', minWidth: 32 }}>
                slug:
              </span>
              <input
                ref={slugRef}
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value.toLowerCase().slice(0, 40));
                  setSlugTouched(true);
                  setSlugError(null);
                }}
                onBlur={() => {
                  if (slug && !isValidSlug(slug)) {
                    setSlugError('Slug must be lowercase letters, digits, and single hyphens.');
                  } else if (slug && getProjects().some((p) => p.slug === slug)) {
                    const conflict = getProjects().find((p) => p.slug === slug)!;
                    setSlugError(`Slug already used by ${conflict.name}`);
                  }
                  setFocusField(null);
                }}
                onFocus={() => setFocusField('slug')}
                placeholder="derived from name"
                style={{
                  flex: 1,
                  fontFamily: 'var(--ff-mono)',
                  fontSize: 14,
                  color: slugError ? 'var(--ember-deep)' : 'var(--fg)',
                  border: 0,
                  borderBottom: slugError
                    ? '1px solid var(--ember-deep)'
                    : '1px dashed var(--line-strong)',
                  background: 'transparent',
                  paddingBottom: 2,
                  outline: 'none',
                }}
              />
              {slug && !slugError && !slugTouched && <Mono dim>· auto</Mono>}
              {slugTouched && !slugError && <Mono dim>· manual</Mono>}
            </div>

            {slugConflictSurfaced && (
              <div
                style={{
                  marginTop: 8,
                  padding: '7px 10px',
                  background: 'color-mix(in srgb, var(--action-deep) 8%, transparent)',
                  borderLeft: '2px solid var(--ember-deep)',
                  borderRadius: '0 3px 3px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ color: 'var(--ember-deep)', fontFamily: 'var(--ff-mono)', fontSize: 11 }}>
                  !
                </span>
                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ember-deep)' }}>
                  {slugError}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <FieldLabel
              hint={
                description.length > 100 ? (
                  <span
                    className="km-mono-sm"
                    style={{
                      color:
                        description.length >= DESCRIPTION_MAX
                          ? 'var(--ember-deep)'
                          : 'var(--fg-faint)',
                    }}
                  >
                    {description.length} / {DESCRIPTION_MAX}
                  </span>
                ) : (
                  '≤ 140 chars · single line'
                )
              }
            >
              Description
            </FieldLabel>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX))}
              onFocus={() => setFocusField('description')}
              onBlur={() => setFocusField(null)}
              placeholder="Short label · shown next to the thread name"
              maxLength={DESCRIPTION_MAX}
              style={{
                width: '100%',
                padding: '9px 12px',
                background: 'var(--surface-1)',
                border:
                  focusField === 'description'
                    ? '1px solid var(--ember)'
                    : '1px solid var(--line)',
                boxShadow:
                  focusField === 'description'
                    ? '0 0 0 3px color-mix(in srgb, var(--action) 18%, transparent)'
                    : 'none',
                borderRadius: 4,
                fontFamily: 'var(--ff-sans)',
                fontSize: 14,
                color: 'var(--fg)',
                outline: 'none',
              }}
            />
          </div>

          {/* Context — collapsed/expanded */}
          {!contextOpen ? (
            <div
              onClick={() => {
                setContextOpen(true);
                queueMicrotask(() => contextRef.current?.focus());
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 0',
                color: 'var(--ember-deep)',
                cursor: 'pointer',
                borderTop: '1px solid var(--line)',
                paddingTop: 14,
              }}
            >
              <Icons.arrowR size={12} />
              <span
                className="km-body"
                style={{ fontWeight: 500, fontSize: 13, color: 'var(--ember-deep)' }}
              >
                Add context for Claude
              </span>
              <Mono dim>· markdown · shipped to Claude on read</Mono>
            </div>
          ) : (
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
              <FieldLabel
                hint={
                  <span
                    style={{
                      fontFamily: 'var(--ff-mono)',
                      fontSize: 11,
                      color:
                        context.length > CONTEXT_SOFT
                          ? 'var(--ember-deep)'
                          : context.length > CONTEXT_SOFT - 200
                          ? 'var(--dust)'
                          : 'var(--fg-faint)',
                    }}
                  >
                    {context.length.toLocaleString()} / {CONTEXT_SOFT.toLocaleString()} soft
                  </span>
                }
              >
                Context for Claude
              </FieldLabel>
              <textarea
                ref={contextRef}
                value={context}
                onChange={(e) => setContext(e.target.value.slice(0, CONTEXT_HARD))}
                onFocus={() => setFocusField('context')}
                onBlur={() => setFocusField(null)}
                placeholder="Longer markdown framing — what this thread is for, how it relates to others, anything Claude should know on first read."
                rows={6}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--surface-1)',
                  border: focusField === 'context' ? '1px solid var(--ember)' : '1px solid var(--line)',
                  boxShadow:
                    focusField === 'context'
                      ? '0 0 0 3px color-mix(in srgb, var(--action) 18%, transparent)'
                      : 'none',
                  borderRadius: 4,
                  fontFamily: 'var(--ff-mono)',
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  color: 'var(--fg)',
                  resize: 'vertical',
                  minHeight: 132,
                  outline: 'none',
                }}
              />
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mono dim>shipped to Claude when this thread is opened in chat</Mono>
                <span style={{ flex: 1 }} />
                {context.length > CONTEXT_SOFT - 200 && context.length <= CONTEXT_SOFT && (
                  <Mono style={{ color: 'var(--dust)' }}>approaching soft cap</Mono>
                )}
                {context.length > CONTEXT_SOFT && (
                  <Mono style={{ color: 'var(--ember-deep)' }}>
                    soft cap exceeded · hard cap {CONTEXT_HARD.toLocaleString()}
                  </Mono>
                )}
              </div>
            </div>
          )}

          {/* Color */}
          <div>
            <FieldLabel hint="tints the thread card border">Color</FieldLabel>
            <div style={{ display: 'flex', gap: mobile ? 10 : 12, marginTop: 2 }}>
              {COLORS.map((c) => (
                <ColorSwatch
                  key={c.name}
                  name={c.name}
                  hex={c.hex}
                  selected={color === c.name}
                  onClick={() => setColor(c.name)}
                />
              ))}
            </div>
          </div>

          {/* Pinned */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 2 }}>
            <MiniToggle on={pinned} onClick={() => setPinned((v) => !v)} />
            <div style={{ flex: 1 }}>
              <div className="km-body" style={{ fontSize: 13, fontWeight: 500 }}>
                Pin to dashboard
              </div>
              <div
                className="km-body-sm"
                style={{ fontSize: 11.5, lineHeight: 1.4, color: 'var(--fg-muted)' }}
              >
                Show on the pinned rail at the top of the dashboard. You can change this anytime.
              </div>
            </div>
          </div>

          {/* Register-this-chat checkbox — only when invoked from a registered chat */}
          {currentChatId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <MiniToggle on={registerChat} onClick={() => setRegisterChat((v) => !v)} />
              <div style={{ flex: 1 }}>
                <div className="km-body" style={{ fontSize: 13, fontWeight: 500 }}>
                  Register this chat
                </div>
                <div
                  className="km-body-sm"
                  style={{ fontSize: 11.5, lineHeight: 1.4, color: 'var(--fg-muted)' }}
                >
                  Attach the current Claude chat to this thread so its activity is tracked here.
                </div>
              </div>
            </div>
          )}

          {networkError && (
            <div
              style={{
                padding: '8px 10px',
                background: 'var(--surface-1)',
                border: '1px solid var(--line-strong)',
                borderRadius: 4,
                color: 'var(--fg)',
                fontSize: 12,
              }}
            >
              {networkError}{' '}
              <button
                className="km-btn km-btn-ghost"
                onClick={submit}
                style={{ padding: '0 4px', color: 'var(--ember-deep)' }}
              >
                Try again
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: mobile ? '14px 18px 18px' : '14px 20px',
            borderTop: '1px solid var(--line)',
            background: mobile ? 'var(--surface-0)' : 'var(--surface-1)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flex: '0 0 auto',
          }}
        >
          {!mobile && <Mono dim>enter to submit · esc to close</Mono>}
          <span style={{ flex: 1 }} />
          <button
            className="km-btn km-btn-ghost"
            onClick={onClose}
            style={{
              color: 'var(--fg-muted)',
              padding: mobile ? '10px 14px' : '8px 12px',
              fontSize: mobile ? 14 : 13,
            }}
          >
            Cancel
          </button>
          <button
            className="km-btn km-btn-primary"
            onClick={submit}
            disabled={!canSubmit}
            style={{
              padding: mobile ? '12px 18px' : '8px 14px',
              fontSize: mobile ? 14 : 13,
              opacity: canSubmit ? 1 : 0.5,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              flex: mobile ? 1 : '0 0 auto',
              justifyContent: 'center',
            }}
          >
            Create thread
            {!mobile && (
              <span
                className="km-kbd"
                style={{
                  marginLeft: 4,
                  background: 'rgba(0,0,0,.18)',
                  color: '#fff',
                  borderColor: 'transparent',
                }}
              >
                ↵
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;
