# 🌾 FermesDirect v2 – Africa's Farm Supply Network

**B2B Intermediation Platform | Bilingual FR/EN | 1M Concurrent Users Ready**

## Quick Start
```bash
npm install
cp .env.example .env   # fill in values
npm run dev            # http://localhost:3000
```

## Production
```bash
pm2 start ecosystem.config.js --env production
# Configure nginx.conf as reverse proxy with SSL
```

## Subscription Plans
### Buyers (B2B): 149 / 399 / 999 CAD/month
### Farmers (Suppliers): 49 / 99 / 199 CAD/month

## API Endpoints
- `POST /api/subscriptions/buyer`
- `POST /api/subscriptions/farmer`
- `GET  /api/subscriptions/plans`
- `POST /api/contact`
- `GET  /health`

## Video Placeholder
In `public/index.html`, find `.vid-frame` and replace the comment block with your YouTube/Vimeo iframe:
```html
<iframe src="https://www.youtube.com/embed/YOUR_ID?autoplay=1"
  width="100%" height="100%" frameborder="0" allowfullscreen></iframe>
```

## Security Features
- Helmet (CSP, HSTS, X-Frame, etc.)
- Rate limiting (global + API + form endpoints)
- XSS protection, HPP, input validation
- Cluster mode (1 worker per CPU core)
- Nginx: TLS 1.2/1.3, gzip, rate limiting, attack blocking

## License
Proprietary © 2026 FermesDirect / Wouessi Inc.
