// Brežice Autocomplete z OpenStreetMap (Nominatim API)
// Brezplačna integracija vseh ulic, cest in hišnih številk v Občini Brežice (tako kot na Google Maps)

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * Poišče točne ceste ali hišne številke v Občini Brežice preko OpenStreetMap
 * @param {string} query - Vneseno besedilo (npr. "Cesta prvih borcev 12" ali "Zakot")
 * @return {Promise<Array<{display_name: string, lat: string, lon: string}>>}
 */
export async function searchBreziceAddress(query) {
  if (!query || query.trim().length < 2) return [];

  const params = new URLSearchParams({
    q: `${query}, Občina Brežice, Slovenija`,
    format: 'json',
    addressdetails: '1',
    limit: '10',
    countrycodes: 'si'
  });

  try {
    const response = await fetch(`${NOMINATIM_BASE_URL}?${params.toString()}`, {
      headers: {
        'User-Agent': 'ResevalnaPostajaBrezice/2.0'
      }
    });
    if (!response.ok) return [];
    const results = await response.json();
    return results.map(item => ({
      display_name: item.display_name,
      lat: item.lat,
      lon: item.lon,
      address: item.address
    }));
  } catch (error) {
    console.error('Napaka pri iskanju naslova preko OpenStreetMap:', error);
    return [];
  }
}

/**
 * Nastavi dinamiko samodejnega predlaganja (autocomplete) na polju vnosov
 * @param {string} inputId - ID HTML vnosnega polja
 */
export function setupDynamicOSMAutocomplete(inputId) {
  const inputEl = document.getElementById(inputId);
  if (!inputEl) return;

  let datalist = document.getElementById(`${inputId}-osm-list`);
  if (!datalist) {
    datalist = document.createElement('datalist');
    datalist.id = `${inputId}-osm-list`;
    document.body.appendChild(datalist);
  }
  inputEl.setAttribute('list', datalist.id);

  let timer = null;
  inputEl.addEventListener('input', (e) => {
    const val = e.target.value;
    clearTimeout(timer);
    if (val.length < 2) return;

    timer = setTimeout(async () => {
      const results = await searchBreziceAddress(val);
      datalist.innerHTML = results.map(r => `<option value="${r.display_name}">`).join('');
    }, 300);
  });
}
