const downloadsEl = document.getElementById('download-count');

async function loadDownloadCount() {
  try {
    const response = await fetch('https://api.github.com/repos/Sepzie/PlayWell/releases');
    if (!response.ok) {
      throw new Error('Request failed');
    }
    const releases = await response.json();
    const total = releases.reduce((sum, release) => {
      const assets = Array.isArray(release.assets) ? release.assets : [];
      return sum + assets.reduce((assetSum, asset) => assetSum + (asset.download_count || 0), 0);
    }, 0);
    downloadsEl.textContent = total.toLocaleString();
  } catch (error) {
    downloadsEl.textContent = 'Unavailable';
  }
}

loadDownloadCount();
