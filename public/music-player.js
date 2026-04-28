let songs = [];
let audio = null;
let currentSongIndex = -1;
let sfxEnabled = true;

export async function initMusic() {
  if (audio) return;

  console.log("🎵 Initializing Background Music...");
  
  try {
    const res = await fetch('/Music/songs.json');
    songs = await res.json();
  } catch (e) {
    console.error("🎵 Failed to load music list:", e);
    // Fallback to initial list if fetch fails
    songs = [
      "BigOlHands.m4a",
      "Daytime TV Raised.mp3",
      "Midnight Grind.mp3",
      "Tropical Bass Land 2.mp3",
      "Wi‑Fi Fridge.mp3",
      "betty boom boom.mp3"
    ];
  }
  audio = new Audio();
  audio.volume = 1.0;

  // Pick a random song to start
  playRandomSong();

  audio.addEventListener('ended', () => {
    console.log("🎵 Song ended, picking next random track...");
    playRandomSong();
  });

  // Handle auto-play restrictions
  const startAudio = () => {
    if (audio.paused) {
      audio.play().then(() => {
        console.log("🎵 Music started after user interaction");
      }).catch(err => {
        console.warn("🎵 Autoplay still blocked:", err);
      });
    }
    // We keep the listeners if play fails, but usually one click is enough
    document.removeEventListener('click', startAudio);
    document.removeEventListener('pointerdown', startAudio);
    document.removeEventListener('keydown', startAudio);
  };

  document.addEventListener('click', startAudio);
  document.addEventListener('pointerdown', startAudio);
  document.addEventListener('keydown', startAudio);

  // Try to play immediately (might work if user already interacted or browser allows)
  audio.play().catch(() => {
    console.log("🎵 Autoplay blocked, waiting for first click...");
  });
}

function playRandomSong() {
  if (songs.length === 0) return;
  
  let nextIndex;
  if (songs.length > 1) {
    do {
      nextIndex = Math.floor(Math.random() * songs.length);
    } while (nextIndex === currentSongIndex);
  } else {
    nextIndex = 0;
  }

  currentSongIndex = nextIndex;
  const songName = songs[currentSongIndex];
  audio.src = `/Music/${encodeURIComponent(songName)}`;
  audio.play().catch(err => {
    // This is expected on first load
  });
  console.log(`🎵 Now playing: ${songName}`);
}

export function setVolume(val) {
  if (audio) audio.volume = val;
}

export function playSpecificSong(filename) {
  if (!audio || !filename) return;
  const targetSrc = `/Music/${encodeURIComponent(filename)}`;
  
  if (audio.src.includes(encodeURIComponent(filename))) return;

  console.log(`🎵 Switching to specific song: ${filename}`);
  audio.src = targetSrc;
  audio.play().catch(err => {});
  
  const idx = songs.indexOf(filename);
  if (idx !== -1) currentSongIndex = idx;
}

export function playNextSong() {
  playRandomSong();
}

export function toggleSFX() {
  sfxEnabled = !sfxEnabled;
  return sfxEnabled;
}

export function isSFXEnabled() {
  return sfxEnabled;
}

export function playAnnouncer(text) {
  if (!sfxEnabled) return;
  try {
    const msg = new SpeechSynthesisUtterance(text);
    msg.rate = 0.9;
    msg.pitch = 0.8;
    window.speechSynthesis.speak(msg);
  } catch {}
}
