function getPortFromUrl(url) {
  try {
    const link = document.createElement('a');
    link.setAttribute('href', url);
    if (link.port == '') {
      if (url.startsWith('https://')) {
        return '443';
      }
      if (url.startsWith('http://')) {
        return '80';
      }
    }
    return link.port;
  } catch (e) {
    console.error('Invalid URL provided to getPortFromUrl:', url);
    return '';
  }
}

function isFromSameOrigin(url) {
  const windowLocationOrigin = 'https://atlas2.kraj-lbc.cz';
  const windowUrlPosition = url.indexOf(windowLocationOrigin);
  console.log('🚀 ~ proxy.service.ts:79 ~ isFromSameOrigin ~ windowUrlPosition:', windowUrlPosition);
  // Check if URL is not from the same origin (matching original logic)
  if (
    windowUrlPosition === -1 ||
    windowUrlPosition > 7 ||
    getPortFromUrl(url) !== getPortFromUrl(windowLocationOrigin)
  ) {
    return false;
  }
  return true;
}

const testUrl = 'https://geoportal.kraj-lbc.cz/cgi-bin/mapserv?map=/data/gis/MapServer/projects/wms/atlas/lesnatost.map&VERSION=1.3.0';
const windowLocationOrigin = 'https://atlas2.kraj-lbc.cz';

console.log('Test URL:', testUrl);
console.log('Window location origin:', windowLocationOrigin);
console.log('Result:', isFromSameOrigin(testUrl));
console.log('URL port:', getPortFromUrl(testUrl));
console.log('Origin port:', getPortFromUrl(windowLocationOrigin)); 
