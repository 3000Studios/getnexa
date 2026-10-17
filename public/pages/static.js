import { h, AdSlot } from '../core.js';

const CONTENT = {
  about: {
    title: 'About Nexa Arcade',
    body: `
      <p>Nexa Arcade is a free, browser-based gaming platform built for fast, instant fun. We believe great games should load in a tab, run smoothly on any device, and reward your time with meaningful progress — levels, achievements, leaderboards, and cosmetics you actually care about.</p>
      <h3>Our mission</h3>
      <p>Bring back the joy of the arcade — no installs, no paywalls to try anything, no intrusive ads in the middle of a round. Sign up takes 10 seconds, and from that moment on your progress lives with you on every device. The arcade cabinet used to demand your quarters and your presence in a specific room. We think the modern version should demand neither: open a tab, pick a game, and be playing within seconds, whether you are on a laptop at your desk or a phone on the bus.</p>
      <h3>What's here today</h3>
      <ul>
        <li>Classic arcade titles rebuilt for the modern web: Snake, 2048, Tetris, Memory, Pong, Breakout, Minesweeper, Tic-Tac-Toe.</li>
        <li>Real-time multiplayer powered by Cloudflare Durable Objects — instant room creation, global low-latency.</li>
        <li>Live leaderboards, cross-device cloud saves, XP/level system, coins, achievements.</li>
      </ul>
      <p>Every game on Nexa Arcade is a real, playable build — not a screenshot, not a demo reel. The classics are rebuilt rather than emulated, so they respond properly to keyboards, touchscreens, and everything in between, and so your scores, saves, and achievements can follow your account instead of living on one machine.</p>
      <h3>How we think about competition</h3>
      <p>Leaderboards only mean something if the scores on them are real. We run server-side validation on submitted scores, keep multiplayer rooms synchronized through Cloudflare Durable Objects rather than trusting any single player's device, and design our XP and coin systems around playing well — not around paying. Coins are earned in game and spent in game; they have no cash value and are never sold as a shortcut past another player.</p>
      <h3>What's next</h3>
      <p>Weekly new titles, tournaments with coin prize pools, a creator program to publish your own games on Nexa, friend lists, and a lot more. Subscribe to our newsletter on the home page to follow along. If there is a classic you want rebuilt or a feature you think the arcade is missing, our contact page lists the right inboxes — reader requests genuinely do shape the roadmap.</p>
      <h3>Built on Cloudflare</h3>
      <p>Every page, every game, every multiplayer room is served from Cloudflare's global edge. That means fast load times wherever you are, and infrastructure that scales with our community. It also means the arcade has no single server room to go down: when you open a tab, you are playing on the copy of Nexa closest to you.</p>
    `,
  },
  privacy: {
    title: 'Privacy Policy',
    body: `
      <p><em>Last updated: ${new Date().toISOString().slice(0, 10)}</em></p>
      <p>Nexa Arcade ("we", "our", "us") operates <a href="https://getnexa.space">getnexa.space</a> (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal information when you use our Service.</p>
      <h3>1. Information we collect</h3>
      <p>When you create an account we collect your email address and a username. We store a salted hash of your password (we never see or store your plaintext password). As you play we record your scores, progress data, XP, and in-game currency balance.</p>
      <p>We use essential cookies to keep you logged in. We may use anonymous analytics cookies to understand aggregate usage (e.g., which games are popular, whether pages load successfully).</p>
      <h3>2. How we use your information</h3>
      <p>We use your information to operate the Service — authenticate you, save your progress, display leaderboards, process purchases, and communicate with you about updates you've asked for (e.g., newsletter opt-in).</p>
      <h3>3. Advertising</h3>
      <p>We display advertising from Google AdSense and other third-party networks. These networks may use cookies to serve ads based on your prior visits. You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener">Google Ads Settings</a>.</p>
      <h3>4. Data sharing</h3>
      <p>We do not sell your personal information. We share it only with service providers that help us run the Service (hosting, payments, analytics, email) under strict confidentiality obligations.</p>
      <h3>5. Your rights</h3>
      <p>You can request access to, correction of, or deletion of your personal data at any time by emailing <a href="mailto:privacy@getnexa.space">privacy@getnexa.space</a>.</p>
      <h3>6. Children</h3>
      <p>Nexa Arcade is not directed to children under 13. We do not knowingly collect personal information from children under 13.</p>
      <h3>7. Changes</h3>
      <p>We may update this policy. We will post the new policy on this page and update the "last updated" date above.</p>
      <h3>8. Contact</h3>
      <p>Questions? Email <a href="mailto:privacy@getnexa.space">privacy@getnexa.space</a>.</p>
    `,
  },
  terms: {
    title: 'Terms of Service',
    body: `
      <p><em>Last updated: ${new Date().toISOString().slice(0, 10)}</em></p>
      <h3>1. Acceptance</h3>
      <p>By using Nexa Arcade you agree to these Terms. If you do not agree, do not use the Service. These Terms apply to the website, the games, multiplayer features, and any related services we operate under the Nexa Arcade name.</p>
      <h3>2. Accounts</h3>
      <p>You are responsible for safeguarding your password and for any activity under your account. Don't share your account. One person, one account. If you believe your account has been compromised, contact support so we can help you secure it. We may require you to verify account details before making changes to an account's email address or credentials.</p>
      <h3>3. Acceptable use</h3>
      <p>Don't cheat, script, or exploit. Don't harass other players. Don't try to break the Service. Submitting scores you did not earn — through modified clients, automation, or exploits — is a violation of these Terms, and scores obtained that way may be removed. We may suspend accounts that violate these rules, and repeat violations may result in permanent removal from leaderboards and multiplayer.</p>
      <h3>4. Purchases and subscriptions</h3>
      <p>All purchases are final unless required by law. Subscriptions renew automatically until cancelled. You can cancel at any time from your account. Prices and the contents of any paid tier may change; changes apply going forward and do not retroactively alter purchases already completed.</p>
      <h3>5. Virtual items</h3>
      <p>In-game currency ("coins") and virtual items have no real-world monetary value and cannot be exchanged outside the Service. Coins and items are licensed to your account for use within Nexa Arcade; they are not your property, cannot be transferred between accounts, and have no value if an account is terminated for violating these Terms.</p>
      <h3>6. User content and conduct in multiplayer</h3>
      <p>Usernames, chat, and any other content you submit must not be unlawful, threatening, or infringing. You keep ownership of content you create, and you grant us a license to display it within the Service. We may remove content and restrict accounts that violate this section, with or without notice, where we reasonably believe it is necessary to protect other players or the Service.</p>
      <h3>7. Disclaimer</h3>
      <p>The Service is provided "as is" without warranty of any kind. We are not liable for lost progress, downtime, or any indirect damages.</p>
      <h3>8. Termination</h3>
      <p>You can delete your account at any time. We may suspend or terminate accounts that violate these Terms.</p>
      <h3>9. Changes</h3>
      <p>We may update these Terms. Continued use after the update constitutes acceptance.</p>
      <h3>10. Contact</h3>
      <p>Email <a href="mailto:legal@getnexa.space">legal@getnexa.space</a>.</p>
    `,
  },
  cookies: {
    title: 'Cookie Policy',
    body: `
      <p><em>Last updated: ${new Date().toISOString().slice(0, 10)}</em></p>
      <p>Cookies are small text files a website stores on your device. Nexa Arcade uses a deliberately short list of them: cookies that keep you logged in, cookies that help us understand — in aggregate — whether the site is healthy, and cookies set by advertising partners to serve and measure ads. This page explains each category and how to control them. You can disable cookies in your browser; some parts of the Service (like being logged in) will not work without them.</p>
      <h3>Essential cookies</h3>
      <ul><li><code>nexa_session</code> — authenticates your session. Required for login.</li></ul>
      <p>Essential cookies are the minimum the Service needs to function. Without a session cookie we cannot tell your account from anyone else's, which means no saved progress, no cloud saves, and no multiplayer identity. These cookies are not used for advertising and are not shared with third parties for their own purposes.</p>
      <h3>Analytics cookies</h3>
      <p>We use anonymous analytics to measure aggregate site health: which games are popular, whether pages load successfully, and roughly how many people are playing. "Aggregate" means we look at totals and patterns, not at what an individual player did. No personal information from analytics is shared with third parties, and analytics data is never sold.</p>
      <h3>Advertising cookies</h3>
      <p>Google AdSense and partner networks may set cookies to show you personalized ads — ads chosen partly on the basis of your prior visits to this and other websites. This is how free, ad-supported services like ours pay for servers. You are in control of personalization: opt out at <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener">Google Ads Settings</a>, opt out of many third-party vendors at once at <a href="https://optout.aboutads.info" target="_blank" rel="noopener">aboutads.info</a>, and read <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener">Google's advertising policies</a> for the full details. Opting out does not remove ads; it makes them non-personalized.</p>
      <h3>Managing cookies in your browser</h3>
      <p>Every major browser lets you block, clear, or allow cookies per site. Clearing cookies will log you out of Nexa Arcade and reset preferences stored locally, but it will not delete your account, your scores, or your saves — those live with your account and return when you sign back in.</p>
    `,
  },
  contact: {
    title: 'Contact',
    body: `
      <p>Need help? Want to partner? Found a bug? We'd love to hear from you. Nexa Arcade is a small operation, and real people read every inbox below — using the right one gets your message to the right person fastest.</p>
      <ul>
        <li>General: <a href="mailto:hello@getnexa.space">hello@getnexa.space</a> — questions, feedback, game requests, partnership inquiries.</li>
        <li>Support: <a href="mailto:support@getnexa.space">support@getnexa.space</a> — account problems, lost progress, bugs, billing questions.</li>
        <li>Privacy: <a href="mailto:privacy@getnexa.space">privacy@getnexa.space</a> — data access, correction, or deletion requests.</li>
        <li>Legal: <a href="mailto:legal@getnexa.space">legal@getnexa.space</a> — terms, copyright, and legal notices.</li>
      </ul>
      <h3>Getting a faster answer</h3>
      <p>For support requests, a few details turn a three-email exchange into a one-email fix: your username, the game or page where the problem happened, what you expected to see versus what actually happened, and your device and browser (for example, "Chrome on Windows" or "Safari on iPhone"). If a score, save, or purchase looks wrong, tell us roughly when it happened — timestamps help us find the matching records quickly.</p>
      <h3>Privacy and account requests</h3>
      <p>Requests to access, correct, export, or delete your personal data should go to the privacy inbox above so they are handled under our Privacy Policy. For security, we may ask you to confirm control of the email address on the account before making changes.</p>
      <h3>Response times</h3>
      <p>We reply within 1-2 business days. Support and privacy requests are answered in the order received; if your issue is keeping you out of your account entirely, say so in the subject line and we will prioritize it.</p>
    `,
  },
};

export function StaticPage(key) {
  const c = CONTENT[key];
  if (!c) return h('div', { class: 'container section' }, h('h2', {}, 'Not found'));
  return h('div', { class: 'container section', style: 'max-width: 820px;' },
    h('h1', {}, c.title),
    h('div', { class: 'panel', html: c.body }),
    AdSlot('inContent')
  );
}
