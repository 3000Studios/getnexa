const fs = require('fs');
const path = require('path');

const musicDir = path.join(__dirname, '../public/Music');
const outputFile = path.join(musicDir, 'songs.json');

const extensions = ['.mp3', '.m4a', '.wav', '.ogg'];

try {
  const files = fs.readdirSync(musicDir);
  const songs = files.filter(file => extensions.includes(path.extname(file).toLowerCase()));
  
  fs.writeFileSync(outputFile, JSON.stringify(songs, null, 2));
  console.log(`Successfully synced ${songs.length} songs to ${outputFile}`);
} catch (err) {
  console.error('Error syncing music:', err);
}
