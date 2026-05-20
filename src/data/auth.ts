// Client-side auth calls. These don't touch the fixture cache — they're
// session lifecycle, separate from the data layer in actions.ts.

export type LoginResult = 'ok' | 'bad-password' | 'error';

export const login = async (password: string): Promise<LoginResult> => {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
      credentials: 'same-origin',
    });
    if (res.ok) return 'ok';
    return res.status === 401 ? 'bad-password' : 'error';
  } catch {
    return 'error';
  }
};

export const logout = async (): Promise<void> => {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
    });
  } catch {
    // ignore — we reload regardless
  }
};

export type ChangePasswordResult = { ok: true } | { ok: false; error: string };

export const changePassword = async (
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> => {
  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
      credentials: 'same-origin',
    });
    if (res.ok) return { ok: true };
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      fields?: Record<string, string>;
    };
    const fieldErr =
      body.fields?.currentPassword === 'incorrect'
        ? 'Current password is incorrect.'
        : body.fields?.newPassword === 'min_8_chars'
          ? 'New password must be at least 8 characters.'
          : undefined;
    return { ok: false, error: fieldErr ?? body.error ?? 'Change failed.' };
  } catch {
    return { ok: false, error: "Couldn't reach the server." };
  }
};
