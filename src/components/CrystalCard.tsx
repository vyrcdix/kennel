// v0.5 Crystal card — the blaze-accented hero of the salient layer.
// Typed via `ctype`: principle gets the big-card treatment by default
// (per v0.5 §E), quote renders italic with a left-bar accent, others
// take the default ink-on-warm-card.

import { useNavigate } from 'react-router-dom';
import { Icons } from './Icon';
import { KindIcon } from './KindIcon';
import { formatRelative } from '../data/time';
import type { CrystalType, Item } from '../data/types';

const CTYPE_LABEL: Record<CrystalType, string> = {
  principle: 'PRINCIPLE',
  quote: 'QUOTE',
  reminder: 'REMINDER',
  hint: 'HINT',
  memory: 'MEMORY',
};

export type CrystalCardProps = {
  item: Item;
  /** Force the hero-sized variant. By default, `principle` is big and
   *  every other ctype (and null) is default-sized. */
  big?: boolean;
  /** Source-kind glyphs to render under the body (lineage preview). */
  sourceKinds?: Item['kind'][];
  /** If provided, clicking the card navigates here. Default: the crystal
   *  detail page at /crystal/:itemId. */
  href?: string;
};

export const CrystalCard = ({
  item,
  big,
  sourceKinds,
  href,
}: CrystalCardProps) => {
  const navigate = useNavigate();
  const ctype = item.ctype;
  const isBig = big ?? ctype === 'principle';
  const isQuote = ctype === 'quote';
  const age = formatRelative(item.doneAt ?? item.lastSurfacedAt ?? item.updatedAt);

  const onClick = () => navigate(href ?? `/crystal/${item.id}`);

  return (
    <div
      className="km-v4"
      onClick={onClick}
      style={{
        breakInside: 'avoid',
        marginBottom: 12,
        padding: 2,
        borderRadius: 9,
        background:
          'linear-gradient(150deg, var(--v-blaze), color-mix(in srgb, var(--v-blaze) 28%, transparent))',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          background: 'var(--v-card)',
          borderRadius: 7,
          padding: isBig ? '16px 18px' : '13px 15px',
          display: 'flex',
          flexDirection: 'column',
          gap: 7,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Icons.gem size={12} stroke="var(--v-blaze-dk)" />
          <span
            style={{
              fontFamily: 'var(--ff-display)',
              fontSize: 9,
              letterSpacing: '.14em',
              fontWeight: 600,
              color: 'var(--v-blaze-dk)',
            }}
          >
            {ctype ? CTYPE_LABEL[ctype] : 'CRYSTAL'}
          </span>
          <span style={{ flex: 1 }} />
          <span className="km-v4" style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--v-faint)' }}>
            {age}
          </span>
        </div>

        <div
          className="vd"
          style={{
            fontFamily: 'var(--ff-display)',
            fontSize: isBig ? 19 : 15,
            fontWeight: isQuote ? 500 : 700,
            fontStyle: isQuote ? 'italic' : 'normal',
            color: 'var(--v-ink)',
            lineHeight: 1.25,
          }}
        >
          {isQuote ? `“${item.title}”` : item.title}
        </div>

        {item.body && (
          <div
            style={{
              fontSize: 12.5,
              lineHeight: 1.5,
              color: 'var(--v-soft)',
              display: '-webkit-box',
              WebkitLineClamp: isBig ? 4 : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.body}
          </div>
        )}

        {sourceKinds && sourceKinds.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 2,
            }}
          >
            <span style={{ display: 'inline-flex', gap: 4 }}>
              {sourceKinds.slice(0, 4).map((k, i) => (
                <span key={i} style={{ color: 'var(--v-faint)' }}>
                  <KindIcon kind={k} size={12} />
                </span>
              ))}
            </span>
            <span
              style={{
                fontFamily: 'var(--ff-mono)',
                fontSize: 11,
                color: 'var(--v-faint)',
              }}
            >
              {sourceKinds.length} {sourceKinds.length === 1 ? 'source' : 'sources'}
            </span>
            <span style={{ flex: 1 }} />
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                color: 'var(--v-blaze-dk)',
                fontFamily: 'var(--ff-mono)',
                fontSize: 10.5,
              }}
            >
              drill <Icons.arrowR size={10} stroke="var(--v-blaze-dk)" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrystalCard;
