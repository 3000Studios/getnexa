import { h, api, toast, state, route } from '../core.js';

const AVATAR_PRESETS = [
  '🕹️', '👾', '🚀', '🔥', '💎', '👑', '🦸', '🥷', '🐲', '🦄', '⚡', '🌈',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Shadow',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Brave'
];

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
      h('h1', { style: 'text-align: center;' }, 'Log in'),
      h('p', { style: 'text-align: center;' }, 'Welcome back — your games are waiting.'),
      h('form', { class: 'form', onSubmit },
        h('label', {}, 'Username or email'),
        h('input', { name: 'identifier', required: true, autocomplete: 'username', placeholder: 'Enter username or email' }),
        h('label', {}, 'Password'),
        h('input', { name: 'password', type: 'password', required: true, autocomplete: 'current-password', placeholder: '••••••••' }),
        h('button', { class: 'btn btn-primary btn-block', type: 'submit', style: 'margin-top: 10px;' }, 'Log in'),
        h('p', { class: 'hint', style: 'text-align:center; margin-top: 20px;' },
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
      h('h1', { style: 'text-align: center;' }, 'Create account'),
      h('p', { style: 'text-align: center;' }, 'Free forever. Save scores and earn coins as you play.'),
      h('form', { class: 'form', onSubmit },
        h('label', {}, 'Username'),
        h('input', { name: 'username', required: true, pattern: '^[a-zA-Z0-9_]{3,20}$', autocomplete: 'username', placeholder: 'Pick a cool name' }),
        h('div', { class: 'hint' }, '3-20 characters. Letters, numbers, underscore only.'),
        h('label', {}, 'Email'),
        h('input', { name: 'email', type: 'email', required: true, autocomplete: 'email', placeholder: 'your@email.com' }),
        h('label', {}, 'Password'),
        h('input', { name: 'password', type: 'password', required: true, minLength: 8, autocomplete: 'new-password', placeholder: 'At least 8 characters' }),
        h('label', {}, 'Confirm password'),
        h('input', { name: 'password2', type: 'password', required: true, minLength: 8, autocomplete: 'new-password', placeholder: 'Type it again' }),
        h('button', { class: 'btn btn-primary btn-block', type: 'submit', style: 'margin-top: 10px;' }, 'Create account'),
        h('p', { class: 'hint', style: 'text-align:center; margin-top: 20px;' },
          'Already have an account? ',
          h('a', { href: '/login', 'data-link': true }, 'Log in')
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
      const avatar = form.avatar.value || form.selected_avatar.value;
      await api('/api/profile', { 
        method: 'PATCH', 
        body: { 
          display_name: form.display.value, 
          avatar: avatar 
        } 
      });
      state.user = { ...state.user, display_name: form.display.value, avatar: avatar };
      toast('Profile saved!', 'success');
    } catch (e) { toast(e.message, 'error'); }
  };

  const wrap = h('div', { class: 'container section' },
    h('div', { style: 'display:flex; gap: 20px; justify-content: space-between; align-items: center; margin-bottom: 30px;' },
      h('div', {},
        h('h1', {}, `Hi, ${user.display_name || user.username} 👋`),
        h('p', { style: 'font-size: 16px;' }, 
          h('span', { class: 'pill pill-accent' }, `Level ${user.level}`), ' ',
          h('span', { class: 'pill' }, `${user.xp} XP`), ' ',
          h('span', { class: 'pill pill-hot' }, `🪙 ${user.coins} coins`), ' ',
          h('span', { class: 'pill' }, `Tier: ${user.tier.toUpperCase()}`)
        ),
      ),
      h('button', { class: 'btn', onClick: onLogout }, 'Log out')
    ),
    h('div', { style: 'display:grid; grid-template-columns: 1fr 1fr; gap: 30px;', class: 'account-grid' },
      h('div', { class: 'panel' },
        h('h2', { style: 'margin-bottom: 20px;' }, 'Customize Profile'),
        h('form', { class: 'form', onSubmit: onSave },
          h('div', { class: 'avatar-preview', id: 'avatar-preview' }, 
            user.avatar?.startsWith('http') 
              ? h('img', { src: user.avatar }) 
              : h('span', {}, user.avatar || '👤')
          ),
          h('label', {}, 'Display Name'),
          h('input', { name: 'display', defaultValue: user.display_name || user.username, maxLength: 40 }),
          
          h('label', {}, 'Choose an Avatar'),
          h('div', { class: 'avatar-presets' },
            ...AVATAR_PRESETS.map(p => h('div', { 
              class: `avatar-opt ${user.avatar === p ? 'active' : ''}`, 
              onClick: (e) => {
                wrap.querySelectorAll('.avatar-opt').forEach(el => el.classList.remove('active'));
                e.currentTarget.classList.add('active');
                wrap.querySelector('input[name="selected_avatar"]').value = p;
                const preview = wrap.querySelector('#avatar-preview');
                if (p.startsWith('http')) {
                  preview.innerHTML = `<img src="${p}" style="width:100%; height:100%; object-fit:cover;"/>`;
                } else {
                  preview.innerHTML = `<span>${p}</span>`;
                }
              }
            }, p.startsWith('http') ? h('img', { src: p, style: 'width:100%; height:100%; object-fit:cover; border-radius:50%;' }) : p))
          ),
          h('input', { type: 'hidden', name: 'selected_avatar', value: user.avatar || '' }),

          h('label', {}, 'Or Paste Image URL (Profile Picture)'),
          h('input', { 
            name: 'avatar', 
            defaultValue: user.avatar?.startsWith('http') ? user.avatar : '', 
            placeholder: 'https://...', 
            maxLength: 200,
            onInput: (e) => {
              const val = e.target.value.trim();
              if (val.startsWith('http')) {
                const preview = wrap.querySelector('#avatar-preview');
                preview.innerHTML = `<img src="${val}" />`;
              }
            }
          }),
          
          h('button', { class: 'btn btn-primary btn-block', type: 'submit', style: 'margin-top: 10px;' }, 'Save Changes'),
        )
      ),
      h('div', { class: 'stack' },
        h('div', { class: 'panel' },
          h('h2', { style: 'margin-bottom: 10px;' }, 'Membership'),
          h('p', {}, 'Go ad-free, earn 2x XP, unlock private rooms, and get exclusive cosmetics.'),
          h('a', { href: '/shop', 'data-link': true, class: 'btn btn-accent btn-block' }, 'Visit the Shop →')
        ),
        h('div', { class: 'panel' },
          h('h2', { style: 'margin-bottom: 10px;' }, 'Stats'),
          h('p', {}, 'Your total statistics across all games.'),
          h('div', { class: 'stat-row' }, h('span', { class: 'k' }, 'Games Played'), h('span', { class: 'v' }, 'Calculating...')),
          h('div', { class: 'stat-row' }, h('span', { class: 'k' }, 'Total Wins'), h('span', { class: 'v' }, '0')),
          h('div', { class: 'stat-row' }, h('span', { class: 'k' }, 'Global Rank'), h('span', { class: 'v' }, '#9,999+'))
        )
      ),
    )
  );

  return wrap;
}
