import { useEffect, useState } from 'react';
import { ChromeBar } from '../components/ChromeBar';
import { NavRail } from '../components/NavRail';
import { Label } from '../components/Label';
import { Mono } from '../components/Mono';
import { SegBtn } from '../components/SegBtn';
import { Icons } from '../components/Icon';
import {
  fetchRoutingStatus,
  updateSettings,
  type RoutingStatus,
} from '../data/actions';
import { changePassword, logout } from '../data/auth';
import { getSettings } from '../data/selectors';
import { useStoreVersion } from '../data/store';
import { useTheme, type ThemeMode } from '../lib/theme';
import { useSkin, type Skin } from '../lib/skin';
import { useDensity, type Density } from '../lib/density';

const SettingsRow = ({
  label,
  hint,
  control,
}: {
  label: string;
  hint?: string;
  control: React.ReactNode;
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '220px 1fr',
      padding: '14px 0',
      borderTop: '1px solid var(--line)',
      alignItems: 'flex-start',
      gap: 24,
    }}
  >
    <div>
      <div className="km-body" style={{ fontWeight: 500 }}>{label}</div>
      {hint && (
        <div className="km-body-sm" style={{ marginTop: 2, lineHeight: 1.45 }}>
          {hint}
        </div>
      )}
    </div>
    <div>{control}</div>
  </div>
);

const Toggle = ({
  on,
  onClick,
}: {
  on: boolean;
  onClick?: () => void;
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

type SectionKey =
  | 'appearance'
  | 'lifecycle'
  | 'routing'
  | 'mcp'
  | 'account';

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'appearance', label: 'Appearance' },
  { key: 'lifecycle', label: 'Capture & Lifecycle' },
  { key: 'routing', label: 'Smart Routing' },
  { key: 'mcp', label: 'MCP connection' },
  { key: 'account', label: 'Account' },
];

export const SettingsScreen = () => {
  useStoreVersion();
  const [section, setSection] = useState<SectionKey>('appearance');
  const [mode, setMode] = useTheme();
  const modes: { label: string; value: ThemeMode }[] = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'System', value: 'system' },
  ];

  const [skin, setSkinMode] = useSkin();
  const skinCards: { value: Skin; name: string; desc: string; swatch: string[] }[] = [
    { value: 'life', name: 'Life', desc: 'Tidewater — the same app, dressed for running a life.', swatch: ['#14808A', '#DB8A4C', '#EBEEE3', '#4E8A6A'] },
    { value: 'workshop', name: 'Workshop', desc: 'The original — blaze & dust, for deep project work.', swatch: ['#D9622C', '#E8B547', '#EEE2C9', '#5C7A3E'] },
  ];
  const [density, setDensityMode] = useDensity();
  const densities: { label: string; value: Density }[] = [
    { label: 'Roomy', value: 'roomy' },
    { label: 'Cozy', value: 'cozy' },
    { label: 'Compact', value: 'compact' },
  ];

  const settings = getSettings();
  const [agingDraft, setAgingDraft] = useState(settings.agingThresholdDays);
  useEffect(() => setAgingDraft(settings.agingThresholdDays), [settings.agingThresholdDays]);
  const commitAging = () => {
    const n = Math.round(agingDraft);
    if (n >= 7 && n <= 180 && n !== settings.agingThresholdDays) {
      void updateSettings({ agingThresholdDays: n });
    } else {
      setAgingDraft(settings.agingThresholdDays);
    }
  };
  const setFilingPromptDays = (n: 0 | 90 | 180) => {
    if (n !== settings.filingPromptDays) void updateSettings({ filingPromptDays: n });
  };

  // Account — change shared password.
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const submitPassword = async () => {
    setPwMsg(null);
    if (pwNew.length < 8) {
      setPwMsg({ ok: false, text: 'New password must be at least 8 characters.' });
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwMsg({ ok: false, text: 'New password and confirmation do not match.' });
      return;
    }
    setPwBusy(true);
    const result = await changePassword(pwCurrent, pwNew);
    setPwBusy(false);
    if (result.ok) {
      setPwMsg({ ok: true, text: 'Password changed. Other sessions were signed out.' });
      setPwCurrent('');
      setPwNew('');
      setPwConfirm('');
    } else {
      setPwMsg({ ok: false, text: result.error });
    }
  };

  const [dormantDraft, setDormantDraft] = useState(settings.dormantThresholdDays);
  useEffect(() => setDormantDraft(settings.dormantThresholdDays), [settings.dormantThresholdDays]);
  const commitDormant = () => {
    const n = Math.round(dormantDraft);
    if (n >= 30 && n <= 365 && n !== settings.dormantThresholdDays) {
      void updateSettings({ dormantThresholdDays: n });
    } else {
      setDormantDraft(settings.dormantThresholdDays);
    }
  };
  // v0.5 §B: crystal resurface cadence. 7-180 day range, default 30.
  const [resurfaceDraft, setResurfaceDraft] = useState(settings.resurfaceIntervalDays);
  useEffect(
    () => setResurfaceDraft(settings.resurfaceIntervalDays),
    [settings.resurfaceIntervalDays],
  );
  const commitResurface = () => {
    const n = Math.round(resurfaceDraft);
    if (n >= 7 && n <= 180 && n !== settings.resurfaceIntervalDays) {
      void updateSettings({ resurfaceIntervalDays: n });
    } else {
      setResurfaceDraft(settings.resurfaceIntervalDays);
    }
  };
  const toggleShowTemperature = () => {
    void updateSettings({ showTemperature: !settings.showTemperature });
  };

  // Smart Routing — daily classifier cap (1–500, default 200) and the
  // confidence threshold (0.30–0.85, default 0.55).
  const [capDraft, setCapDraft] = useState(settings.routingDailyCap);
  useEffect(
    () => setCapDraft(settings.routingDailyCap),
    [settings.routingDailyCap],
  );
  const commitCap = () => {
    const n = Math.round(capDraft);
    if (n >= 1 && n <= 500 && n !== settings.routingDailyCap) {
      void updateSettings({ routingDailyCap: n });
    } else {
      setCapDraft(settings.routingDailyCap);
    }
  };
  const [thresholdDraft, setThresholdDraft] = useState(
    settings.routingConfidenceThreshold,
  );
  useEffect(
    () => setThresholdDraft(settings.routingConfidenceThreshold),
    [settings.routingConfidenceThreshold],
  );
  const commitThreshold = () => {
    // Round to the 0.01 the slider exposes so we don't chase float drift.
    const n = Math.round(thresholdDraft * 100) / 100;
    if (
      n >= 0.3 &&
      n <= 0.85 &&
      Math.abs(n - settings.routingConfidenceThreshold) > 1e-6
    ) {
      void updateSettings({ routingConfidenceThreshold: n });
    } else {
      setThresholdDraft(settings.routingConfidenceThreshold);
    }
  };
  // Server-side configured + key fingerprint. Fetched once on mount;
  // a key rotation requires a service restart anyway, so we don't poll.
  const [routingStatus, setRoutingStatus] = useState<RoutingStatus | null>(null);
  useEffect(() => {
    let live = true;
    void fetchRoutingStatus().then((s) => {
      if (live) setRoutingStatus(s);
    });
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="km" style={{ display: 'flex', flexDirection: 'column' }}>
      <ChromeBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NavRail active="settings" />
        <main className="km-scroll" style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ display: 'flex' }}>
            {/* Settings nav */}
            <aside
              style={{
                width: 200,
                flex: '0 0 200px',
                borderRight: '1px solid var(--line)',
                padding: '22px 0',
                minHeight: '100%',
              }}
            >
              <div style={{ padding: '0 18px 8px' }}>
                <Label>Settings</Label>
              </div>
              {SECTIONS.map((s) => {
                const active = section === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => setSection(s.key)}
                    className="km-row"
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      border: 0,
                      padding: '7px 18px',
                      background: active ? 'color-mix(in srgb, var(--action) 8%, transparent)' : 'transparent',
                      boxShadow: active ? 'inset 2px 0 0 var(--ember)' : 'none',
                      color: active ? 'var(--ember-deep)' : 'var(--fg)',
                      fontSize: 13,
                      fontFamily: 'var(--ff-sans)',
                      cursor: 'pointer',
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </aside>

            <div style={{ flex: 1, padding: '22px 36px 32px', maxWidth: 880 }}>
              {section === 'appearance' && (
                <>
              <div className="km-display-lg" style={{ marginBottom: 4 }}>Appearance</div>
              <div className="km-body" style={{ color: 'var(--fg-muted)', marginBottom: 18 }}>
                The skin is the dress; mode is the temperature. {skin === 'life'
                  ? 'Density tightens spacing without shrinking type.'
                  : 'Workshop runs at one density.'}
              </div>

              {/* Skin picker cards */}
              <div className="km-display-sm" style={{ marginBottom: 8 }}>Skin</div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                {skinCards.map((c) => {
                  const on = skin === c.value;
                  return (
                    <button
                      key={c.value}
                      onClick={() => setSkinMode(c.value)}
                      style={{
                        textAlign: 'left',
                        cursor: 'pointer',
                        flex: 1,
                        padding: 16,
                        borderRadius: 'var(--r-card, 8px)',
                        border: `1.5px solid ${on ? 'var(--action)' : 'var(--line-strong)'}`,
                        background: on ? 'color-mix(in srgb, var(--action) 8%, var(--surface-1))' : 'var(--surface-1)',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                        {c.swatch.map((s, i) => (
                          <span key={i} style={{ width: 26, height: 26, borderRadius: 8, background: s }} />
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 700 }}>{c.name}</span>
                        {on && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--ember-deep)', fontSize: 11, fontFamily: 'var(--ff-mono)' }}>
                            <Icons.check size={12} /> active
                          </span>
                        )}
                      </div>
                      <div className="km-body-sm" style={{ color: 'var(--fg-muted)', marginTop: 4 }}>{c.desc}</div>
                    </button>
                  );
                })}
              </div>

              <div style={{ borderBottom: '1px solid var(--line)' }}>
                <SettingsRow
                  label="Mode"
                  hint="Light is default. Dark is a peer."
                  control={
                    <div style={{ display: 'inline-flex' }}>
                      {modes.map((m) => (
                        <SegBtn
                          key={m.value}
                          label={m.label}
                          active={mode === m.value}
                          onClick={() => setMode(m.value)}
                        />
                      ))}
                    </div>
                  }
                />
                {skin === 'life' && (
                  <SettingsRow
                    label="Density"
                    hint="Tidewater runs roomy by default. Tighten if you like more on screen — only spacing changes, type never shrinks."
                    control={
                      <div style={{ display: 'inline-flex' }}>
                        {densities.map((d) => (
                          <SegBtn
                            key={d.value}
                            label={d.label}
                            active={density === d.value}
                            onClick={() => setDensityMode(d.value)}
                          />
                        ))}
                      </div>
                    }
                  />
                )}
                <SettingsRow
                  label="Focus mode"
                  hint="Hides the pinned-thread rail and side panels on the dashboard so only the In focus list is visible."
                  control={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="km-kbd">⌘</span>
                      <span className="km-kbd">⇧</span>
                      <span className="km-kbd">F</span>
                      <Mono dim>toggle</Mono>
                    </div>
                  }
                />
              </div>
                </>
              )}

              {section === 'lifecycle' && (
                <>
              <div className="km-display-lg" style={{ marginBottom: 4 }}>
                Capture &amp; Lifecycle
              </div>
              <div className="km-body" style={{ color: 'var(--fg-muted)', marginBottom: 20 }}>
                How long an item drifts before it shows up on the aging board, and whether
                Steep ever nudges you to file durable outcomes.
              </div>
              <div style={{ borderBottom: '1px solid var(--line)' }}>
                <SettingsRow
                  label="Aging threshold"
                  hint="Items untouched for longer than this appear on the Aging board. 7–180 days."
                  control={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="number"
                        min={7}
                        max={180}
                        value={agingDraft}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (Number.isFinite(n)) setAgingDraft(n);
                        }}
                        onBlur={commitAging}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        }}
                        style={{
                          width: 72,
                          padding: '4px 8px',
                          fontFamily: 'var(--ff-mono)',
                          fontSize: 13,
                          background: 'var(--surface-1)',
                          color: 'var(--fg)',
                          border: '1px solid var(--line)',
                          borderRadius: 3,
                        }}
                      />
                      <Mono dim>days · default 21</Mono>
                    </div>
                  }
                />
                <SettingsRow
                  label="Filing prompts"
                  hint="Periodic nudges to file long-untouched items. Off by default — Aging covers most of this."
                  control={
                    <div style={{ display: 'inline-flex' }}>
                      <SegBtn
                        label="Never"
                        active={settings.filingPromptDays === 0}
                        onClick={() => setFilingPromptDays(0)}
                      />
                      <SegBtn
                        label="After 90d"
                        active={settings.filingPromptDays === 90}
                        onClick={() => setFilingPromptDays(90)}
                      />
                      <SegBtn
                        label="After 180d"
                        active={settings.filingPromptDays === 180}
                        onClick={() => setFilingPromptDays(180)}
                      />
                    </div>
                  }
                />
                <SettingsRow
                  label="Dormant threshold"
                  hint="Days untouched before a panel reads as dormant in the temperature signal. 30–365 days."
                  control={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="number"
                        min={30}
                        max={365}
                        value={dormantDraft}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (Number.isFinite(n)) setDormantDraft(n);
                        }}
                        onBlur={commitDormant}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        }}
                        style={{
                          width: 72,
                          padding: '4px 8px',
                          fontFamily: 'var(--ff-mono)',
                          fontSize: 13,
                          background: 'var(--surface-1)',
                          color: 'var(--fg)',
                          border: '1px solid var(--line)',
                          borderRadius: 3,
                        }}
                      />
                      <Mono dim>days · default 60</Mono>
                    </div>
                  }
                />
                <SettingsRow
                  label="Show temperature"
                  hint="Panel-level time signal — top-edge color and a header timestamp on each panel. Off flattens every panel to neutral."
                  control={
                    <Toggle on={settings.showTemperature} onClick={toggleShowTemperature} />
                  }
                />
                <SettingsRow
                  label="Crystal resurface cadence"
                  hint="How long before a crystal becomes due to revisit. Touch (or click Still true) resets the timer. 7–180 days."
                  control={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="number"
                        min={7}
                        max={180}
                        value={resurfaceDraft}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (Number.isFinite(n)) setResurfaceDraft(n);
                        }}
                        onBlur={commitResurface}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        }}
                        style={{
                          width: 72,
                          padding: '4px 8px',
                          fontFamily: 'var(--ff-mono)',
                          fontSize: 13,
                          background: 'var(--surface-1)',
                          color: 'var(--fg)',
                          border: '1px solid var(--line)',
                          borderRadius: 3,
                        }}
                      />
                      <Mono dim>days · default 30</Mono>
                    </div>
                  }
                />
              </div>
                </>
              )}

              {section === 'routing' && (
                <>
                  <div className="km-display-lg" style={{ marginBottom: 4 }}>
                    Smart Routing
                  </div>
                  <div
                    className="km-body"
                    style={{ color: 'var(--fg-muted)', marginBottom: 20 }}
                  >
                    Paste a chunk of text (⌘⇧V from anywhere) and Claude picks
                    where it lands — bench / doc / guidebook entry / runbook
                    section / field-notes section. The cap is daily; the
                    threshold below floors the classifier's confidence (anything
                    weaker falls through to the bench).
                  </div>
                  <div style={{ borderBottom: '1px solid var(--line)' }}>
                    <SettingsRow
                      label="Anthropic API key"
                      hint="Read-only — the key lives in the server's secrets.env (prod) or .env.local (dev). Rotate by editing that file and restarting kennel; the UI never holds the value."
                      control={
                        routingStatus === null ? (
                          <Mono dim>checking…</Mono>
                        ) : routingStatus.configured ? (
                          <Mono>
                            {routingStatus.fingerprint ?? '<set>'}
                          </Mono>
                        ) : (
                          <Mono style={{ color: 'var(--ember-deep)' }}>
                            not set — paste classification disabled
                          </Mono>
                        )
                      }
                    />
                    <SettingsRow
                      label="Daily classifier cap"
                      hint="Maximum classifier calls per day across every thread. Past this point, paste/email routings still land but go straight to the bench (no Anthropic call). Range 1–500."
                      control={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="number"
                            min={1}
                            max={500}
                            value={capDraft}
                            onChange={(e) => {
                              const n = Number(e.target.value);
                              if (Number.isFinite(n)) setCapDraft(n);
                            }}
                            onBlur={commitCap}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter')
                                (e.target as HTMLInputElement).blur();
                            }}
                            style={{
                              width: 72,
                              padding: '4px 8px',
                              fontFamily: 'var(--ff-mono)',
                              fontSize: 13,
                              background: 'var(--surface-1)',
                              color: 'var(--fg)',
                              border: '1px solid var(--line)',
                              borderRadius: 3,
                            }}
                          />
                          <Mono dim>routings · default 200</Mono>
                        </div>
                      }
                    />
                    <SettingsRow
                      label="Confidence threshold"
                      hint="Classifier picks below this confidence get rewritten to the bench (with the original action recorded in the explanation). Higher = more conservative routing. Range 0.30–0.85."
                      control={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input
                            type="range"
                            min={30}
                            max={85}
                            step={1}
                            value={Math.round(thresholdDraft * 100)}
                            onChange={(e) =>
                              setThresholdDraft(Number(e.target.value) / 100)
                            }
                            onMouseUp={commitThreshold}
                            onKeyUp={commitThreshold}
                            style={{ width: 160 }}
                          />
                          <Mono>{thresholdDraft.toFixed(2)}</Mono>
                          <Mono dim>default 0.55</Mono>
                        </div>
                      }
                    />
                  </div>
                </>
              )}

              {section === 'mcp' && (() => {
                const mcpUrl =
                  typeof window !== 'undefined'
                    ? `${window.location.protocol}//${window.location.hostname}:8421/mcp`
                    : 'http://127.0.0.1:8421/mcp';
                const tokenSet = false; // KENNEL_MCP_TOKEN is unset in dev
                return (
                  <>
                    <div className="km-display-lg" style={{ marginBottom: 4 }}>
                      MCP connection
                    </div>
                    <div className="km-body" style={{ color: 'var(--fg-muted)', marginBottom: 20 }}>
                      How Claude clients reach this Steep. Token rotation happens via
                      the <Mono>KENNEL_MCP_TOKEN</Mono> env var; the UI flow lands when
                      auth is wired (backlog #1).
                    </div>
                    <div className="km-card" style={{ padding: '12px 14px' }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '120px 1fr 80px',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <Mono dim>url</Mono>
                        <Mono>{mcpUrl}</Mono>
                        <button
                          className="km-link"
                          onClick={() => void navigator.clipboard?.writeText(mcpUrl)}
                          style={{
                            textAlign: 'right',
                            fontSize: 12,
                            border: 0,
                            background: 'transparent',
                            cursor: 'pointer',
                            color: 'var(--ember-deep)',
                          }}
                          title="Copy MCP URL"
                        >
                          copy
                        </button>
                        <Mono dim>token</Mono>
                        <Mono>{tokenSet ? 'knl_sk_••••••••••••••••' : 'none · dev'}</Mono>
                        <span
                          className="km-link"
                          style={{
                            textAlign: 'right',
                            fontSize: 12,
                            color: 'var(--fg-faint)',
                            cursor: 'not-allowed',
                          }}
                          title="Not wired — set KENNEL_MCP_TOKEN env var on the server to enable bearer auth"
                        >
                          rotate
                        </span>
                        <Mono dim>transport</Mono>
                        <Mono>streamable http · session-keyed</Mono>
                        <span />
                      </div>
                    </div>
                    <div
                      className="km-body-sm"
                      style={{ color: 'var(--fg-muted)', marginTop: 12, lineHeight: 1.55, maxWidth: 600 }}
                    >
                      Register this URL in Claude Desktop or Claude Code via{' '}
                      <Mono>{'{"mcpServers":{"kennel":{"url":"…"}}}'}</Mono>. See{' '}
                      <Mono>docs/mcp-setup.md</Mono> for the full setup walkthrough.
                    </div>

                    {/* Working with Claude — example prompts */}
                    <div
                      className="km-display-lg"
                      style={{ marginTop: 28, marginBottom: 4, fontSize: 22 }}
                    >
                      Working with Claude
                    </div>
                    <div
                      className="km-body"
                      style={{ color: 'var(--fg-muted)', marginBottom: 14 }}
                    >
                      Once Steep is registered, you don't run commands — you ask
                      Claude in plain language and it picks the right tool. Some
                      things worth asking, in a Steep-connected chat:
                    </div>
                    <div
                      className="km-card"
                      style={{ padding: '4px 0' }}
                    >
                      {[
                        ['Capture', '"Add an idea to the kennel thread: …"'],
                        ['Sort', '"What\'s in my sort queue?" · "Pick up the third one."'],
                        ['Aging', '"What\'s gone cold across my threads?"'],
                        ['Crystallize', '"Promote the design-brief doc to a crystallization."'],
                        ['Field notes', '"Draft the open questions for the kennel field notes."'],
                        ['Runbook', '"Update the Run section of the picnic-engage runbook."'],
                        ['Review', '"Summarise what changed this week."'],
                      ].map(([label, example]) => (
                        <div
                          key={label}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '110px 1fr',
                            alignItems: 'baseline',
                            gap: 12,
                            padding: '7px 14px',
                            borderBottom: '1px solid var(--line)',
                          }}
                        >
                          <span className="km-display-sm" style={{ fontSize: 10 }}>
                            {label}
                          </span>
                          <span
                            className="km-body"
                            style={{ fontSize: 13, color: 'var(--fg)' }}
                          >
                            {example}
                          </span>
                        </div>
                      ))}
                      <div style={{ padding: '8px 14px' }}>
                        <Mono dim>
                          37 tools total — Claude discovers them on connect; you
                          never type tool names.
                        </Mono>
                      </div>
                    </div>
                  </>
                );
              })()}

              {section === 'account' && (
                <>
                  <div className="km-display-lg" style={{ marginBottom: 4 }}>
                    Account
                  </div>
                  <div className="km-body" style={{ color: 'var(--fg-muted)', marginBottom: 20 }}>
                    Steep uses a single shared password. Changing it signs out
                    every other session — re-share the new password with anyone
                    in the circle.
                  </div>

                  <div style={{ borderBottom: '1px solid var(--line)' }}>
                    <SettingsRow
                      label="Current password"
                      control={
                        <input
                          type="password"
                          className="km-input"
                          value={pwCurrent}
                          onChange={(e) => setPwCurrent(e.target.value)}
                          style={{ width: 240, fontSize: 13 }}
                        />
                      }
                    />
                    <SettingsRow
                      label="New password"
                      hint="At least 8 characters."
                      control={
                        <input
                          type="password"
                          className="km-input"
                          value={pwNew}
                          onChange={(e) => setPwNew(e.target.value)}
                          style={{ width: 240, fontSize: 13 }}
                        />
                      }
                    />
                    <SettingsRow
                      label="Confirm new password"
                      control={
                        <input
                          type="password"
                          className="km-input"
                          value={pwConfirm}
                          onChange={(e) => setPwConfirm(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void submitPassword();
                          }}
                          style={{ width: 240, fontSize: 13 }}
                        />
                      }
                    />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginTop: 14,
                    }}
                  >
                    <button
                      className="km-btn km-btn-primary"
                      onClick={() => void submitPassword()}
                      disabled={pwBusy || !pwNew || !pwConfirm}
                      style={{ opacity: pwBusy || !pwNew || !pwConfirm ? 0.5 : 1 }}
                    >
                      {pwBusy ? 'Changing…' : 'Change password'}
                    </button>
                    {pwMsg && (
                      <Mono
                        style={{
                          color: pwMsg.ok ? 'var(--moss)' : 'var(--ember-deep)',
                        }}
                      >
                        {pwMsg.text}
                      </Mono>
                    )}
                  </div>

                  <div
                    className="km-display-lg"
                    style={{ marginTop: 28, marginBottom: 4, fontSize: 22 }}
                  >
                    Session
                  </div>
                  <div className="km-body" style={{ color: 'var(--fg-muted)', marginBottom: 14 }}>
                    Sign out of this device. Claude's MCP connection is separate
                    and stays connected.
                  </div>
                  <button
                    className="km-btn"
                    onClick={async () => {
                      await logout();
                      window.location.reload();
                    }}
                  >
                    Sign out
                  </button>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsScreen;
