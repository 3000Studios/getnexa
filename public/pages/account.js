import { h, api, toast, state, route } from '../core.js';

const AVATAR_PRESETS = [
  '🕹️', '👾', '🚀', '🔥', '💎', '👑', '🦸', '🥷', '🐲', '🦄', '⚡', '🌈',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Shadow',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Brave'
];

function DataStream() {
  const el = h('div', { class: 'data-stream' });
  for (let i = 0; i < 30; i++) {
    const col = h('div', { class: 'stream-column', style: `left: ${i * 3.3}%; animation-duration: ${Math.random() * 5 + 5}s; animation-delay: ${Math.random() * 5}s;` }, 
      Array(20).fill(0).map(() => Math.random() > 0.5 ? '1' : '0').join('<br/>')
    );
    el.appendChild(col);
  }
  return el;
}

export function LoginPage() {
  let showPassword = false;
  const flash = h('div', { class: 'flash-overlay' }, h('h2', { style: 'color:#000; font-size: 40px;' }, 'SYSTEM READY'));

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'VALIDATING...';
    btn.disabled = true;

    try {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: { identifier: form.identifier.value.trim(), password: form.password.value },
      });
      state.user = res.user;
      
      // Post-Login Transition
      flash.classList.add('flash-active');
      setTimeout(() => {
        route('/account');
        flash.classList.remove('flash-active');
      }, 800);
    } catch (e) { 
      toast(e.message, 'error');
      btn.textContent = 'AUTHENTICATE';
      btn.disabled = false;
    }
  };

  const wrap = h('div', { class: 'container section' },
    DataStream(),
    flash,
    h('div', { class: 'login-container stagger-in' },
      h('div', { class: 'login-scanner' }),
      h('h1', { style: 'text-align: center; font-size: 32px;' }, 'Initialize Session'),
      h('p', { style: 'text-align: center; color: var(--text-dim); margin-bottom: 30px;' }, 'Decrypting operative credentials...'),
      
      h('form', { class: 'form', onSubmit },
        h('label', {}, 'Operative ID'),
        h('input', { 
          name: 'identifier', required: true, autocomplete: 'username', placeholder: 'Username or Email',
          onInput: (e) => {
            e.target.classList.toggle('input-valid', e.target.value.includes('@'));
            e.target.classList.toggle('input-error', e.target.value.length === 0);
          }
        }),

        h('label', {}, 'Security Key'),
        h('div', { style: 'position:relative;' },
          h('input', { 
            name: 'password', type: 'password', required: true, autocomplete: 'current-password', placeholder: '••••••••',
            ref: (el) => { if (el) el.type = showPassword ? 'text' : 'password'; }
          }),
          h('span', { 
            style: 'position:absolute; right:15px; top:50%; transform:translateY(-50%); cursor:pointer; font-size:18px;',
            onClick: (e) => {
              showPassword = !showPassword;
              const input = e.target.previousSibling;
              input.type = showPassword ? 'text' : 'password';
              e.target.textContent = showPassword ? '👁️' : '🔒';
            }
          }, '🔒')
        ),

        h('div', { style: 'display:flex; justify-content: space-between; align-items: center; margin: 15px 0;' },
          h('label', { style: 'display:flex; align-items:center; gap: 8px; cursor:pointer; font-size: 14px;' }, 
            h('input', { type: 'checkbox', name: 'remember', style: 'width:auto; margin:0;' }), 'Persistent Session'
          ),
          h('a', { href: '/forgot-password', style: 'font-size: 14px; color: var(--neon-cyan);' }, 'Reset Key?')
        ),

        h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'AUTHENTICATE'),

        // Social Logins
        h('div', { style: 'margin-top: 30px; text-align: center;' },
          h('p', { class: 'hint', style: 'margin-bottom: 15px;' }, 'OR QUICK-SYNC VIA'),
          h('div', { style: 'display:grid; grid-template-columns: 1fr 1fr; gap: 10px;' },
            h('button', { class: 'btn btn-ghost', type: 'button' }, 'Discord'),
            h('button', { class: 'btn btn-ghost', type: 'button' }, 'Google')
          )
        ),

        h('p', { class: 'hint', style: 'text-align:center; margin-top: 30px;' },
          'New Recruit? ',
          h('a', { href: '/signup', 'data-link': true, style: 'color: var(--neon-cyan);' }, 'Create your Legend')
        )
      )
    )
  );

  return wrap;
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
      toast('Account initialized. Welcome, Operative.', 'success');
      route('/account');
    } catch (e) { toast(e.message, 'error'); }
  };
  return h('div', { class: 'container section', style: 'max-width: 500px;' },
    DataStream(),
    h('div', { class: 'login-container stagger-in' },
      h('div', { class: 'login-scanner' }),
      h('h1', { style: 'text-align: center;' }, 'Recruitment'),
      h('p', { style: 'text-align: center; color: var(--text-dim);' }, 'Forge your legend in the grid.'),
      h('form', { class: 'form', onSubmit },
        h('label', {}, 'Operative Codename'),
        h('input', { name: 'username', required: true, pattern: '^[a-zA-Z0-9_]{3,20}$', placeholder: 'Alpha_One' }),
        h('label', {}, 'Contact Node (Email)'),
        h('input', { name: 'email', type: 'email', required: true, placeholder: 'operative@nexa.com' }),
        h('label', {}, 'Security Key'),
        h('input', { name: 'password', type: 'password', required: true, minLength: 8, placeholder: '••••••••' }),
        h('label', {}, 'Confirm Key'),
        h('input', { name: 'password2', type: 'password', required: true, minLength: 8, placeholder: '••••••••' }),
        
        h('button', { class: 'btn btn-primary btn-block', type: 'submit', style: 'margin-top: 20px;' }, 'CREATE LEGEND'),
        
        h('p', { class: 'hint', style: 'text-align:center; margin-top: 20px;' },
          'Already active? ',
          h('a', { href: '/login', 'data-link': true, style: 'color: var(--neon-cyan);' }, 'Initialize Session')
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
    toast('Session Terminated', 'success');
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
      toast('Profile Synchronized', 'success');
    } catch (e) { toast(e.message, 'error'); }
  };

  const wrap = h('div', { class: 'container section' },
    h('div', { style: 'display:flex; gap: 20px; justify-content: space-between; align-items: center; margin-bottom: 30px;' },
      h('div', {},
        h('h1', {}, `OPERATIVE: ${user.display_name || user.username}`),
        h('p', { style: 'font-size: 16px;' }, 
          h('span', { class: 'pill pill-accent' }, `Rank ${user.level}`), ' ',
          h('span', { class: 'pill' }, `${user.xp} XP`), ' ',
          h('span', { class: 'pill pill-hot' }, `🪙 ${user.coins} NEXA`), ' ',
          h('span', { class: 'pill' }, `Tier: ${user.tier.toUpperCase()}`)
        ),
      ),
      h('button', { class: 'btn', onClick: onLogout }, 'TERMINATE SESSION')
    ),
    h('div', { style: 'display:grid; grid-template-columns: 1fr 1fr; gap: 30px;', class: 'account-grid' },
      h('div', { class: 'panel' },
        h('h2', { style: 'margin-bottom: 20px;' }, 'Configuration'),
        h('form', { class: 'form', onSubmit: onSave },
          h('div', { class: 'avatar-preview', id: 'avatar-preview' }, 
            user.avatar?.startsWith('http') 
              ? h('img', { src: user.avatar }) 
              : h('span', {}, user.avatar || '👤')
          ),
          h('label', {}, 'Display Designation'),
          h('input', { name: 'display', defaultValue: user.display_name || user.username, maxLength: 40 }),
          
          h('label', {}, 'Identity Presets'),
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

          h('label', {}, 'Direct Image Uplink (URL)'),
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
          
          h('button', { class: 'btn btn-primary btn-block', type: 'submit', style: 'margin-top: 10px;' }, 'SYNCHRONIZE'),
        )
      ),
      h('div', { class: 'stack' },
        h('div', { class: 'panel' },
          h('h2', { style: 'margin-bottom: 10px;' }, 'Elite Status'),
          h('p', {}, 'Unlock 2x XP multipliers, private grid access, and legendary cosmetics.'),
          h('a', { href: '/shop', 'data-link': true, class: 'btn btn-accent btn-block' }, 'REQUISITION GEAR →')
        ),
        h('div', { class: 'panel' },
          h('h2', { style: 'margin-bottom: 10px;' }, 'Combat Logs'),
          h('p', {}, 'Historical performance data across the grid.'),
          h('div', { class: 'stat-row' }, h('span', { class: 'k' }, 'Ops Completed'), h('span', { class: 'v' }, 'Calculating...')),
          h('div', { class: 'stat-row' }, h('span', { class: 'k' }, 'Total Victories'), h('span', { class: 'v' }, '0')),
          h('div', { class: 'stat-row' }, h('span', { class: 'k' }, 'Global Standing'), h('span', { class: 'v' }, '#9,999+'))
        )
      ),
    )
  );

  return wrap;
}
