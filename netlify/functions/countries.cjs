const API_BASE_URL = 'https://api.restcountries.com/countries/v5';
const LIST_FIELDS = [
  'names.common',
  'codes.alpha_2',
  'codes.alpha_3',
  'population',
  'flag.url_png',
  'flag.url_svg',
  'area.kilometers',
  'capitals.name',
  'languages.name',
  'currencies.code',
  'currencies.name',
  'currencies.symbol',
  'region',
  'subregion',
  'continents',
  'borders',
  'calling_codes',
  'timezones',
].join(',');

function jsonResponse(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { message: 'Only GET requests are supported.' }, { Allow: 'GET' });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return jsonResponse(503, { message: 'Country data is temporarily unavailable.' });
  }

  const query = event.queryStringParameters || {};
  const upstreamQuery = new URLSearchParams({ response_fields: LIST_FIELDS });
  let endpoint;

  if (query.action === 'list') {
    const requestedLimit = Number(query.limit || '100');
    const requestedOffset = Number(query.offset || '0');
    if (!Number.isInteger(requestedLimit) || !Number.isInteger(requestedOffset) || requestedOffset < 0) {
      return jsonResponse(400, { message: 'Invalid country page parameters.' });
    }

    upstreamQuery.set('limit', String(Math.min(Math.max(requestedLimit, 1), 100)));
    upstreamQuery.set('offset', String(requestedOffset));
    endpoint = API_BASE_URL;
  } else if (query.action === 'detail') {
    const code = (query.code || '').toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) {
      return jsonResponse(400, { message: 'A two-letter country code is required.' });
    }

    endpoint = `${API_BASE_URL}/codes.alpha_2/${encodeURIComponent(code)}`;
  } else if (query.action === 'name') {
    const name = (query.name || '').trim();
    if (!name || name.length > 100) {
      return jsonResponse(400, { message: 'A country name between 1 and 100 characters is required.' });
    }

    endpoint = `${API_BASE_URL}/name`;
    upstreamQuery.set('q', name);
  } else {
    return jsonResponse(400, { message: 'Unsupported country data request.' });
  }

  try {
    const upstream = await fetch(`${endpoint}?${upstreamQuery.toString()}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
    });
    const body = await upstream.json();
    const cacheHeaders = upstream.ok
      ? { 'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' }
      : {};
    return jsonResponse(upstream.status, body, cacheHeaders);
  } catch {
    return jsonResponse(502, { message: 'Unable to reach the country data service.' });
  }
};
