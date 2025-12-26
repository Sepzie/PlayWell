const downloadsEl = document.getElementById('download-count');
const setupLink = document.getElementById('download-setup');
const portableLink = document.getElementById('download-portable');
const setupSigLink = document.getElementById('download-setup-sig');
const portableSigLink = document.getElementById('download-portable-sig');

function updateDownloadLinks(release) {
  const assets = Array.isArray(release.assets) ? release.assets : [];
  const findAsset = (suffix) => assets.find((asset) => asset.name && asset.name.endsWith(suffix));
  const setupAsset = findAsset('-release-setup.exe');
  const portableAsset = findAsset('-release-portable.exe');
  const setupSigAsset = findAsset('-release-setup.exe.sig');
  const portableSigAsset = findAsset('-release-portable.exe.sig');

  if (setupAsset && setupLink) {
    setupLink.href = setupAsset.browser_download_url;
  }
  if (portableAsset && portableLink) {
    portableLink.href = portableAsset.browser_download_url;
  }
  if (setupSigAsset && setupSigLink) {
    setupSigLink.href = setupSigAsset.browser_download_url;
  }
  if (portableSigAsset && portableSigLink) {
    portableSigLink.href = portableSigAsset.browser_download_url;
  }
}

async function loadReleaseData() {
  try {
    const response = await fetch('https://api.github.com/repos/Sepzie/PlayWell/releases');
    if (!response.ok) {
      throw new Error('Request failed');
    }
    const releases = await response.json();
    const latestRelease = Array.isArray(releases) ? releases.find((release) => !release.draft) : null;
    const total = releases.reduce((sum, release) => {
      const assets = Array.isArray(release.assets) ? release.assets : [];
      const exeAssets = assets.filter((asset) => asset.name && asset.name.toLowerCase().endsWith('.exe'));
      return sum + exeAssets.reduce((assetSum, asset) => assetSum + (asset.download_count || 0), 0);
    }, 0);
    downloadsEl.textContent = total.toLocaleString();
    if (latestRelease) {
      updateDownloadLinks(latestRelease);
    }
  } catch (error) {
    downloadsEl.textContent = 'Unavailable';
  }
}

loadReleaseData();
