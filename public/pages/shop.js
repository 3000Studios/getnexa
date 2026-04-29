import { h, api, AdSlot, toast, state, route } from '../core.js';

export function ShopPage() {
  const grid = h('div', { class: 'shop-grid' });
  const page = h('div', { class: 'container section' },
    h('div', { class: 'section-head' },
      h('div', {},
        h('div', { class: 'section-eyebrow' }, 'Shop'),
        h('h1', {}, 'Power up'),
        h('p', { style: 'max-width: 640px;' }, 'Subscriptions remove ads and unlock premium features. Coin packs give in-game currency. Cosmetics personalize your profile. Everything pays via Stripe or PayPal — no sign-ups anywhere else.'),
      )
    ),
    AdSlot('728x90', 'Sponsored'),
    h('div', { class: 'operative-promo panel', style: 'border: 1px solid var(--primary); background: linear-gradient(135deg, rgba(0, 243, 255, 0.1), rgba(188, 19, 254, 0.1)); margin-bottom: 24px;' },
      h('div', { class: 'row', style: 'align-items: center;' },
        h('div', { style: 'flex: 1;' },
          h('div', { class: 'section-eyebrow', style: 'color: var(--primary);' }, 'Recommended'),
          h('h2', { style: 'margin: 5px 0;' }, 'NEXA OPERATIVE'),
          h('p', { style: 'font-size: 14px;' }, 'Ad-Free Play • Exclusive Epic Skins • 500 Credits/Mo • Priority Support'),
        ),
        h('div', {},
          h('button', { class: 'btn btn-primary', onClick: () => buyStripe('operative_tier') }, 'Sync Now — $4.99/mo')
        )
      )
    ),
    grid,
    h('div', { class: 'panel', style: 'margin-top: 28px;' },
      h('h3', {}, 'Spend your 🪙 coins'),
      h('p', {}, 'Earn coins by playing. Redeem them for cosmetics, hints, and extras — no purchase required.'),
      h('div', { class: 'row', style: 'margin-top: 10px;' },
        h('button', { class: 'btn', onClick: () => spendCoins('theme_arcade_free', 500) }, 'Arcade Theme — 500 🪙'),
        h('button', { class: 'btn', onClick: () => spendCoins('hint_bundle_small', 250) }, 'Hint Bundle — 250 🪙'),
        h('button', { class: 'btn', onClick: () => spendCoins('extra_life_1', 100) }, 'Extra Life — 100 🪙'),
      )
    )
  );

  api('/api/shop/products').then(({ products }) => {
    grid.innerHTML = '';
    products.forEach(p => grid.appendChild(Product(p)));
  }).catch(() => {});

  return page;
}

function Product(p) {
  return h('div', { class: 'product' },
    h('div', {},
      h('div', { class: 'type' }, p.type + (p.recurring ? ' · Monthly' : '')),
      h('h3', { style: 'margin: 6px 0 2px; font-size: 17px;' }, p.name),
      h('div', { class: 'price' }, `$${(p.price_cents / 100).toFixed(2)}`),
    ),
    h('div', { class: 'product-actions' },
      h('button', { class: 'btn btn-primary', onClick: () => buyStripe(p.id) }, 'Pay with Card'),
      h('button', { class: 'btn', onClick: () => buyPaypal(p.id), style: 'background: #ffc439; color: #000; border-color: transparent; font-weight: 800;' }, 'PayPal'),
    )
  );
}

async function buyStripe(productId) {
  if (!state.user) { toast('Please log in', ''); route('/login'); return; }
  try {
    const res = await api('/api/pay/stripe/checkout', { method: 'POST', body: { product_id: productId } });
    if (res.url) location.href = res.url;
  } catch (e) {
    if (String(e.message).toLowerCase().includes('not configured')) {
      toast('Stripe not yet activated by admin — try PayPal or spend coins', 'error');
    } else toast(e.message, 'error');
  }
}

async function buyPaypal(productId) {
  if (!state.user) { toast('Please log in', ''); route('/login'); return; }
  try {
    const res = await api('/api/pay/paypal/create', { method: 'POST', body: { product_id: productId } });
    if (res.url) location.href = res.url;
  } catch (e) {
    if (String(e.message).toLowerCase().includes('not configured')) {
      toast('PayPal not yet activated by admin — try Stripe or spend coins', 'error');
    } else toast(e.message, 'error');
  }
}

async function spendCoins(itemId, cost) {
  if (!state.user) { toast('Please log in first', ''); route('/login'); return; }
  try {
    const res = await api('/api/shop/spend-coins', { method: 'POST', body: { item_id: itemId, cost } });
    state.user.coins = res.remaining_coins;
    toast('Redeemed! Item added to your inventory.', 'success');
  } catch (e) { toast(e.message, 'error'); }
}

export function CheckoutPage({ query }) {
  const provider = query.get('provider') || 'stripe';
  const status = query.get('status') || '';
  const order = query.get('order');
  const paypalToken = query.get('token'); // PayPal returns ?token=ORDER_ID&PayerID=...

  const container = h('div', { class: 'container section', style: 'max-width: 640px;' });

  if (provider === 'paypal' && paypalToken && status !== 'cancel') {
    container.appendChild(h('div', { class: 'panel' },
      h('h1', {}, 'Finalizing your PayPal payment…'),
      h('p', {}, 'Please wait.')
    ));
    api('/api/pay/paypal/capture', { method: 'POST', body: { paypal_order_id: paypalToken } })
      .then((r) => {
        if (r.ok) { toast('Payment successful! 🎉', 'success'); route('/account'); }
        else { toast('Payment not completed.', 'error'); }
      })
      .catch((e) => toast(e.message, 'error'));
    return container;
  }

  if (status === 'success') {
    container.appendChild(h('div', { class: 'panel' },
      h('h1', {}, 'Payment received 🎉'),
      h('p', {}, `Order #${order} via ${provider}. Thanks for supporting Nexa Arcade! Your purchase is being applied to your account.`),
      h('div', { class: 'row' },
        h('a', { href: '/account', 'data-link': true, class: 'btn btn-primary' }, 'Go to account'),
        h('a', { href: '/games', 'data-link': true, class: 'btn' }, 'Back to games'),
      )
    ));
    return container;
  }
  if (status === 'cancel') {
    container.appendChild(h('div', { class: 'panel' },
      h('h1', {}, 'Payment cancelled'),
      h('p', {}, 'No charges were made. You can try again any time.'),
      h('a', { href: '/shop', 'data-link': true, class: 'btn btn-primary' }, 'Back to shop'),
    ));
    return container;
  }
  container.appendChild(h('div', { class: 'panel' },
    h('h1', {}, 'Checkout'),
    h('p', {}, `Order #${order} · ${provider}`),
    h('a', { href: '/shop', 'data-link': true, class: 'btn' }, 'Back to shop')
  ));
  return container;
}
