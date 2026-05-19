import { useEffect, useState } from 'react';
import { ChromeBar } from '../components/ChromeBar';
import { NavRail } from '../components/NavRail';
import { Label } from '../components/Label';
import { Mono } from '../components/Mono';
import { SegBtn } from '../components/SegBtn';
import { updateSettings } from '../data/actions';
import { getSettings } from '../data/selectors';
import { useStoreVersion } from '../data/store';
import { useTheme, type ThemeMode } from '../lib/theme';

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

type SectionKey = 'appearance' | 'lifecycle' | 'mcp';

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'appearance', label: 'Appearance' },
  { key: 'lifecycle', label: 'Capture & Lifecycle' },
  { key: 'mcp', label: 'MCP connection' },
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
  const toggleShowTemperature = () => {
    void updateSettings({ showTemperature: !settings.showTemperature });
  };

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
                      background: active ? 'rgba(217,98,44,.08)' : 'transparent',
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
              <div className="km-body" style={{ color: 'var(--fg-muted)', marginBottom: 20 }}>
                Mode and a few small typographic preferences. Density is not a setting — there is one density.
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
                <SettingsRow
                  label="Accent emphasis"
                  hint="Kennel leans on moss for structure and ember for action. Dialing this up biases ember toward more surfaces; down biases moss."
                  control={
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        maxWidth: 360,
                      }}
                    >
                      <Mono dim>quiet</Mono>
                      <div
                        style={{
                          flex: 1,
                          height: 4,
                          background: 'var(--surface-2)',
                          borderRadius: 2,
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '40%',
                            height: '100%',
                            background: 'var(--ember)',
                            borderRadius: 2,
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: -4,
                            left: '40%',
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: 'var(--ember)',
                            transform: 'translateX(-50%)',
                          }}
                        />
                      </div>
                      <Mono dim>warm</Mono>
                    </div>
                  }
                />
                <SettingsRow
                  label="Monospace family"
                  hint="Used for slugs, timestamps, revisions, runbook commands."
                  control={
                    <div style={{ display: 'inline-flex' }}>
                      <SegBtn label="JetBrains Mono" active />
                      <SegBtn label="IBM Plex Mono" />
                      <SegBtn label="Berkeley Mono" />
                    </div>
                  }
                />
                <SettingsRow
                  label="Relative timestamps"
                  hint="Within 24h, show '2h ago'. Beyond, show absolute. Recommend leaving on."
                  control={<Toggle on />}
                />
                <SettingsRow
                  label="Focus mode shortcut"
                  hint="Hides everything except Next Up and a single project."
                  control={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="km-kbd">⌘</span>
                      <span className="km-kbd">⇧</span>
                      <span className="km-kbd">F</span>
                      <Mono dim>change</Mono>
                    </div>
                  }
                />
                <SettingsRow
                  label="Reduce motion"
                  hint="Disables the 200–300ms ease on state changes."
                  control={<Toggle on={false} />}
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
                Kennel ever nudges you to file durable outcomes.
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
              </div>
                </>
              )}

              {section === 'mcp' && (
                <>
              <div className="km-display-lg" style={{ marginBottom: 4 }}>
                MCP connection
              </div>
              <div className="km-body" style={{ color: 'var(--fg-muted)', marginBottom: 20 }}>
                How Claude clients reach this Kennel. Rotate the token any time a non-Craig surface gets a copy.
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
                  <Mono>https://kennel.dixon.run/mcp</Mono>
                  <span className="km-link" style={{ textAlign: 'right', fontSize: 12 }}>copy</span>
                  <Mono dim>token</Mono>
                  <Mono>knl_sk_••••••••••••••••mZ4q</Mono>
                  <span
                    className="km-link"
                    style={{ textAlign: 'right', fontSize: 12, color: 'var(--ember-deep)' }}
                  >
                    rotate
                  </span>
                  <Mono dim>last reach</Mono>
                  <Mono>14:32 from claude-desktop / mac · ok</Mono>
                  <span />
                </div>
              </div>
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
