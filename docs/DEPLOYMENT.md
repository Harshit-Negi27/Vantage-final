# Deployment Guide

This guide covers deploying Vantage to production environments.

## Overview

Vantage consists of three services that need to be deployed:

1. Frontend (Next.js)
2. Backend (Express.js)
3. AI Server (FastAPI)

Each service can be deployed independently to different platforms.

## Prerequisites

- Domain name (optional but recommended)
- SSL certificates (handled by most platforms)
- Production databases (MongoDB, Neo4j)
- API keys for all services

## Frontend Deployment

### Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications.

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. Navigate to frontend directory:

```bash
cd frontend
```

3. Deploy:

```bash
vercel deploy --prod
```

4. Set environment variables in Vercel dashboard:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_AI_URL=https://your-ai-server-url.com
```

5. Configure custom domain (optional)

### Netlify

1. Connect GitHub repository
2. Set build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
3. Add environment variables
4. Deploy

### AWS Amplify

1. Connect GitHub repository
2. Configure build settings
3. Add environment variables
4. Deploy

## Backend Deployment

### Railway

Railway provides easy deployment with automatic HTTPS.

1. Install Railway CLI:

```bash
npm i -g @railway/cli
```

2. Navigate to backend directory:

```bash
cd backend
```

3. Login and initialize:

```bash
railway login
railway init
```

4. Add environment variables:

```bash
railway variables set AI_BASE_URL=https://your-ai-server.railway.app
railway variables set MONGODB_URI=your_mongodb_connection_string
railway variables set CLOUDINARY_CLOUD_NAME=your_cloud_name
railway variables set CLOUDINARY_API_KEY=your_api_key
railway variables set CLOUDINARY_API_SECRET=your_api_secret
```

5. Deploy:

```bash
railway up
```

### Render

1. Create new Web Service
2. Connect GitHub repository
3. Configure:
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start`
4. Add environment variables
5. Deploy

### Docker

Create `Dockerfile` in backend directory:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5050

CMD ["npm", "start"]
```

Build and deploy:

```bash
docker build -t vantage-backend .
docker push your-registry/vantage-backend
```

## AI Server Deployment

### Railway

1. Navigate to Vantage directory:

```bash
cd Vantage
```

2. Initialize Railway:

```bash
railway init
```

3. Add environment variables:

```bash
railway variables set GROQ_API_KEY=your_groq_key
railway variables set NEO4J_URI=your_neo4j_uri
railway variables set NEO4J_USERNAME=neo4j
railway variables set NEO4J_PASSWORD=your_password
railway variables set TAVILY_API_KEY=your_tavily_key
```

4. Deploy:

```bash
railway up
```

### Render

1. Create new Web Service
2. Connect GitHub repository
3. Configure:
   - Root directory: `Vantage`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn api:app --host 0.0.0.0 --port $PORT`
4. Add environment variables
5. Deploy

### Docker

Create `Dockerfile` in Vantage directory:

```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and deploy:

```bash
docker build -t vantage-ai .
docker push your-registry/vantage-ai
```

## Database Setup

### MongoDB Atlas

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create cluster (free tier available)
3. Create database user
4. Whitelist IP addresses (or allow all for development)
5. Get connection string
6. Update backend environment variables

### Neo4j AuraDB

1. Create account at [Neo4j Aura](https://neo4j.com/cloud/aura/)
2. Create database instance (free tier available)
3. Save credentials
4. Update AI server environment variables
5. Run seed script:

```bash
cd Vantage
python seed.py
```

## Environment Variables

### Production Environment Variables

Create production `.env` files for each service:

#### Frontend (.env.production)

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_AI_URL=https://ai.yourdomain.com
```

#### Backend (.env)

```bash
PORT=5050
AI_BASE_URL=https://ai.yourdomain.com
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/vantage
MONGODB_DB=vantage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### AI Server (.env)

```bash
GROQ_API_KEY=your_production_groq_key
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_production_password
TAVILY_API_KEY=your_production_tavily_key
```

## SSL/HTTPS

Most platforms (Vercel, Railway, Render) provide automatic HTTPS.

For custom deployments:

1. Obtain SSL certificate (Let's Encrypt)
2. Configure reverse proxy (Nginx, Caddy)
3. Update environment variables to use HTTPS URLs

## Custom Domain

### Vercel

1. Go to project settings
2. Add custom domain
3. Update DNS records
4. Wait for SSL provisioning

### Railway

1. Go to project settings
2. Add custom domain
3. Update DNS records (CNAME)
4. SSL is automatic

## Monitoring

### Application Monitoring

Add monitoring service:

- Sentry for error tracking
- LogRocket for session replay
- DataDog for infrastructure monitoring

### Health Checks

Implement health check endpoints:

```javascript
// Backend
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});
```

```python
# AI Server
@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now()}
```

### Uptime Monitoring

Use services like:

- UptimeRobot
- Pingdom
- StatusCake

## Performance Optimization

### Frontend

- Enable Next.js image optimization
- Use CDN for static assets
- Enable compression
- Implement caching headers

### Backend

- Use connection pooling for MongoDB
- Implement rate limiting
- Add response caching
- Enable compression middleware

### AI Server

- Use multiple workers: `uvicorn api:app --workers 4`
- Implement request queuing
- Cache agent instances
- Optimize Neo4j queries

## Security

### Environment Variables

- Never commit `.env` files
- Use platform secret management
- Rotate keys regularly
- Use different keys for production

### CORS

Update CORS settings for production:

```javascript
// Backend
app.use(cors({
  origin: ['https://yourdomain.com'],
  credentials: true
}));
```

```python
# AI Server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Rate Limiting

Implement rate limiting:

```javascript
// Backend
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## Backup Strategy

### Database Backups

- MongoDB Atlas: Automatic backups enabled
- Neo4j Aura: Automatic backups enabled
- Manual backups: Schedule regular exports

### Code Backups

- Use Git for version control
- Push to GitHub regularly
- Tag releases
- Maintain changelog

## Rollback Strategy

1. Keep previous deployment available
2. Use platform rollback features
3. Test rollback procedure
4. Document rollback steps

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        run: |
          cd frontend
          vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: |
          cd backend
          railway up

  deploy-ai:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: |
          cd Vantage
          railway up
```

## Scaling

### Horizontal Scaling

- Frontend: Automatic with Vercel/Netlify
- Backend: Add more instances on Railway/Render
- AI Server: Increase worker count or add instances

### Vertical Scaling

- Upgrade instance sizes on hosting platform
- Increase database resources
- Optimize queries and code

## Cost Optimization

### Free Tiers

- Vercel: Free for personal projects
- Railway: $5 credit per month
- MongoDB Atlas: 512MB free tier
- Neo4j Aura: Free tier available
- Cloudinary: Free tier available

### Paid Plans

- Start with smallest paid plans
- Monitor usage and scale as needed
- Use reserved instances for predictable workloads

## Troubleshooting

### Deployment Fails

- Check build logs
- Verify environment variables
- Test locally first
- Check platform status

### Service Unreachable

- Verify DNS settings
- Check SSL certificate
- Verify firewall rules
- Check service logs

### Database Connection Issues

- Verify connection strings
- Check IP whitelist
- Verify credentials
- Test connection locally

## Post-Deployment

1. Test all features
2. Monitor error rates
3. Check performance metrics
4. Verify backups
5. Update documentation
6. Announce deployment

## Maintenance

- Regular dependency updates
- Security patches
- Database maintenance
- Log rotation
- Performance monitoring

## Support

For deployment issues:

- Check platform documentation
- Review deployment logs
- Open GitHub issue
- Contact platform support
