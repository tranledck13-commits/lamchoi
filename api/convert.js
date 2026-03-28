export default async function handler(req, res) {
  // Cho phép mọi nguồn
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, sub_id } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Thiếu tham số url' });
  }

  const AFFILIATE_ID = '17316230172';

  try {
    // Follow redirect
    const finalUrl = await followRedirect(url);
    
    // Tách ID
    const result = extractShopeeId(finalUrl);

    if (result.success && result.shopId && result.itemId) {
      const origin = `https://shopee.vn/product/${result.shopId}/${result.itemId}`;
      const convertedLink = `https://s.shopee.vn/an_redir?origin_link=${encodeURIComponent(origin)}&affiliate_id=${AFFILIATE_ID}${sub_id ? '&sub_id=' + sub_id : ''}`;

      return res.json({
        success: true,
        shopId: result.shopId,
        itemId: result.itemId,
        convertedLink: convertedLink,
        finalUrl: finalUrl
      });
    }

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ 
      success: false, 
      error: err.message || 'Lỗi không xác định' 
    });
  }
}

async function followRedirect(url) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      timeout: 10000
    });
    return response.url || url;
  } catch (_) {
    return url;
  }
}

function extractShopeeId(url) {
  // Pattern 1: i.{shopId}.{itemId}
  let match = url.match(/i\.(\d+)\.(\d+)/);
  if (match) {
    return {
      success: true,
      shopId: match[1],
      itemId: match[2],
      finalUrl: url
    };
  }

  // Pattern 2: shopee.vn/{slug}/{shopId}/{itemId}
  match = url.match(/shopee\.[a-z.]+\/[^\/]+\/(\d+)\/(\d+)/);
  if (match) {
    return {
      success: true,
      shopId: match[1],
      itemId: match[2],
      finalUrl: url
    };
  }

  // Pattern 3: /product/{shopId}/{itemId}
  match = url.match(/\/product\/(\d+)\/(\d+)/);
  if (match) {
    return {
      success: true,
      shopId: match[1],
      itemId: match[2],
      finalUrl: url
    };
  }

  return {
    success: false,
    error: 'Không tìm thấy Item ID',
    finalUrl: url
  };
}
