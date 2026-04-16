import { h, api, toast, state, route } from '../core.js';

export function LoginPage() {
  const onSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: { identifier: form.identifier.value.trim(), password: form.password.value },
      });
      state.user = res.user;
      toast('Welcome back!', 'success');
      route('/account');
    } catch (e) { toast(e.message, 'error'); }
  };
  return h('div', { class: 'container section', style: 'max-width: 460px;' },
    h('div', { class: 'panel' },
      h('h1', {}, 'Log in'),
      h('p', {}, 'Welcome back — your games are waiting.'),
      h('form', { class: 'form', onSubmit },
        h('label', {}, 'Username or email'),
        h('input', { name: 'identifier', required: true, autocomplete: 'username' }),
        h('label', {}, 'Password'),
        h('input', { name: 'password', type: 'password', required: true, autocomplete: 'current-password' }),
        h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'Log in'),
        h('p', { class: 'hint', style: 'text-align:center' },
          'No account? ',
          h('a', { href: '/signup', 'data-link': true }, 'Sign up free')
        )
      )
    )
  );
}

export function SignupPage() {
  const onSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    if (form.password.value !== form.password2.value) { toast('Passwords do not match', 'error'); return; }
    try {
      const res = await api('/api/auth/signup', {
        method: 'POST',
        body: {
          username: form.username.value.trim(),
          email: form.email.value.trim(),
          password: form.password.value,
        },
      });
      state.user = res.user;
      toast('Account created! Welcome to Nexa Arcade.', 'success');
      route('/account');
    } catch (e) { toast(e.message, 'error'); }
  };
  return h('div', { class: 'container section', style: 'max-width: 500px;' },
    h('div', { class: 'panel' },
      h('h1', {}, 'Create account'),
      h('p', {}, 'Free forever. Save scores, unlock achievements, and earn coins as you play.'),
      h('form', { class: 'form', onSubmit },
        h('label', {}, 'Username'),
        h('input', { name: 'username', required: true, pattern: '^[a-zA-Z0-9_]{3,20}$', autocomplete: 'username' }),
        h('div', { class: 'hint' }, '3-20 characters. Letters, numbers, underscore only.'),
        h('label', {}, 'Email'),
        h('input', { name: 'email', type: 'email', required: true, autocomplete: 'email' }),
        h('label', {}, 'Password'),
        h('input', { name: 'password', type: 'password', required: true, minLength: 8, autocomplete: 'new-password' }),
        h('label', {}, 'Confirm password'),
        h('input', { name: 'password2', type: 'password', required: true, minLength: 8, autocomplete: 'new-password' }),
        h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'Create account'),
        h('p', { class: 'hint', style: 'text-align:center' },
          'Already have an account? ',
          h('a', { href: '/login', 'data-link': true }, 'Log in')
        ),
        h('p', { class: 'hint' }, 'By signing up you agree to our ',
          h('a', { href: '/terms', 'data-link': true }, 'Terms'),
          ' and ',
          h('a', { href: '/privacy', 'data-link': true }, 'Privacy Policy'),
          '.'
        )
      )
    )
  );
}

export function AccountPage() {
  if (!state.user) { route('/login'); return h('div'); }
  const user = state.user;
  const onLogout = async () => {
    try { await api('/api/auth/logout', { method: 'POST' }); } catch {}
    state.user = null;
    toast('Logged out', 'success');
    route('/');
  };
  const onSave = async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      await api('/api/profile', { method: 'PATCH', body: { display_name: form.display.value, avatar: form.avatar.value } });
      toast('Profile saved', 'success');
    } catch (e) { toast(e.message, 'error'); }
  };
  return h('div', { class: 'container section' },
    h('div', { style: 'display:flex; gap: 20px; justify-content: space-between; align-items: center; margin-bottom: 20px;' },
      h('div', {},
        h('h1', {}, `Hi, ${user.username} 👋`),
        h('p', {}, `Level ${user.level} · ${user.xp} XP · 🪙 ${user.coins} coins · Tier: ${user.tier}`),
      ),
      h('button', { class: 'btn', onClick: onLogout }, 'Log out')
    ),
    h('div', { style: 'display:grid; grid-template-columns: 1fr 1fr; gap: 20px;', class: 'account-grid' },
      h('div', { class: 'panel' },
        h('h3', {}, 'Profile'),
        h('form', { class: 'form', onSubmit: onSave },
          h('label', {}, 'Display name'),
          h('input', { name: 'display', defaultValue: user.display_name || user.username, maxLength: 40 }),
          h('label', {}, 'Avatar URL'),
          h('input', { name: 'avatar', placeholder: 'https://…', maxLength: 200 }),
          h('button', { class: 'btn btn-primary', type: 'submit' }, 'Save'),
        )
      ),
      h('div', { class: 'panel' },
        h('h3', {}, 'Upgrade'),
        h('p', {}, 'Go ad-free, double XP, private rooms, exclusive cosmetics.'),
        h('a', { href: '/shop', 'data-link': true, class: 'btn btn-accent' }, 'Visit the shop →')
      ),
    )
  );
}
