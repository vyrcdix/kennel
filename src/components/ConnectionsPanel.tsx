// Connections — renders the INBOUND edges of an entity (what points at
// it): actions serving a crystal, crystals built from a doc, guidebook
// memberships, the item a doc backs. The graph stores all of these;
// this panel is the missing reverse direction. Uses base km tokens only
// so it sits correctly inside both .km and .km-v4 surfaces.

import type { ReactNode } from 'react';
import { Label } from './Label';
import { Mono } from './Mono';

export type ConnectionRow = {
  key: string;
  icon: ReactNode;
  label: string;
  sub?: string;
  onOpen?: () => void;
};

export type ConnectionGroup = {
  label: string;
  /** Family accent for the group's left border (clay/moss/ember/blaze). */
  accent?: string;
  rows: ConnectionRow[];
};

export const ConnectionsPanel = ({
  title = 'Connections',
  groups,
}: {
  title?: string;
  groups: ConnectionGroup[];
}) => {
  const nonEmpty = groups.filter((g) => g.rows.length > 0);
  if (nonEmpty.length === 0) return null;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Label>{title}</Label>
        <Mono dim>
          {nonEmpty.reduce((n, g) => n + g.rows.length, 0)} inbound
        </Mono>
      </div>
      {nonEmpty.map((g) => (
        <div key={g.label} style={{ marginBottom: 14 }}>
          <div
            className="km-mono-sm"
            style={{
              color: g.accent ?? 'var(--fg-faint)',
              letterSpacing: '.1em',
              marginBottom: 6,
            }}
          >
            {g.label}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {g.rows.map((row) => (
              <div
                key={row.key}
                onClick={row.onOpen}
                className="km-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '7px 10px',
                  background: 'var(--surface-1)',
                  border: '1px solid var(--line)',
                  borderLeft: `3px solid ${g.accent ?? 'var(--line)'}`,
                  borderRadius: 4,
                  cursor: row.onOpen ? 'pointer' : 'default',
                }}
              >
                <span style={{ display: 'inline-flex' }}>{row.icon}</span>
                <span
                  className="km-body"
                  style={{
                    flex: 1,
                    fontSize: 13,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {row.label}
                </span>
                {row.sub && <Mono dim>{row.sub}</Mono>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConnectionsPanel;
