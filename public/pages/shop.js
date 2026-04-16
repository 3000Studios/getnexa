import { h, api, AdSlot, toast, state, route } from '../core.js';

export function ShopPage() {
  const grid = h('div', { class: 'shop-grid' });
  const page = h('div', { class: 'container section' },
    h('h1', {}, 'Shop'),
    h('p', {}, 'Boost your experience. Subscriptions support ad-free play and premium features. Cosmetics personalize your profile. Coin packs give you in-game currency.'),
    AdSlot('728x90', 'Sponsored'),
    grid,
    h('div', { class: 'panel', style: 'margin-top: 22px;' },
      h('h3', {}, 'Spend your 🪙 coins'),
      h('p', {}, 'Earn coins by playing. Redeem them for cosmetics, hints, and extras — no purchase required.'),
      h('div', { class: 'row' },
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
      h('div', { class: 'type' }, p.type),
      h('h3', { style: 'margin: 4px 0 2px;' }, p.name),
      h('div', { class: 'price' }, `$${(p.price_cents / 100).toFixed(2)}`),
    ),
    h('button', { class: 'btn btn-primary', onClick: () => buy(p.id) }, 'Buy')
  );
}

async function buy(productId) {
  if (!state.user) { toast('Please log in to purchase', ''); route('/login'); return; }
  try {
    const res = await api('/api/shop/purchase', { method: 'POST', body: { product_id: productId } });
    route(res.checkout_url);
  } catch (e) { toast(e.message, 'error'); }
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
  const pid = query.get('pid');
  const order = query.get('order');
  return h('div', { class: 'container section', style: 'max-width: 600px;' },
    h('div', { class: 'panel' },
      h('h1', {}, 'Checkout'),
      h('p', {}, `Order #${order} · Product: ${pid}`),
      h('p', {}, 'Payments are currently in limited beta. Click the button below to simulate completing this order for testing, or join the waitlist.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn btn-primary', onClick: () => { toast('Thanks! Your order will be fulfilled shortly.', 'success'); route('/account'); } }, 'Simulate successful checkout'),
        h('a', { href: '/account', 'data-link': true, class: 'btn btn-ghost' }, 'Cancel'),
      )
    )
  );
}
