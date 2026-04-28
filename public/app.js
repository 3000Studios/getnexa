import { h, render, route, state, toast } from './core.js';
import { initMusic } from './music-player.js';
import { HomePage } from './pages/home.js';
import { GamesPage, GamePage } from './pages/games.js';
import { LoginPage, SignupPage, AccountPage } from './pages/account.js';
import { ShopPage, CheckoutPage } from './pages/shop.js';
import { LeaderboardsPage } from './pages/leaderboards.js';
import { StaticPage } from './pages/static.js';
import { TournamentsPage } from './pages/tournaments.js';
import { CreatorsPage } from './pages/creators.js';

const routes = [
  { path: '/',                view: HomePage },
  { path: '/games',           view: GamesPage },
  { path: '/games/:id',       view: GamePage },
  { path: '/login',           view: LoginPage },
  { path: '/signup',          view: SignupPage },
  { path: '/account',         view: AccountPage },
  { path: '/shop',            view: ShopPage },
  { path: '/checkout',        view: CheckoutPage },
  { path: '/leaderboards',    view: LeaderboardsPage },
  { path: '/leaderboards/:id',view: LeaderboardsPage },
  { path: '/tournaments',     view: TournamentsPage },
  { path: '/creators',        view: CreatorsPage },
  { path: '/about',           view: () => StaticPage('about') },
  { path: '/privacy',         view: () => StaticPage('privacy') },
  { path: '/terms',           view: () => StaticPage('terms') },
  { path: '/contact',         view: () => StaticPage('contact') },
  { path: '/cookies',         view: () => StaticPage('cookies') },
];

window.addEventListener('popstate', () => render(routes));

(async function boot() {
  // pre-fetch current user
  try {
    const res = await fetch('/api/auth/me');
    const json = await res.json();
    state.user = json.user || null;
  } catch { state.user = null; }
  
  // Initialize background music
  initMusic();
  
  render(routes);
})();

export { route, toast };
