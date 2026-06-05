# Blake Richardson Pre-Save Landing Page — Deployment Guide

## Quick Start

This repository is ready for Vercel deployment. Follow these steps to go live at `presave.blakerichardson.com`.

### Step 1: Deploy to Vercel (5 minutes)

**Option A: Using Vercel CLI**
```bash
# From repo root
vercel --prod --yes

# Answer prompts:
# - Project name: presave
# - Framework: Other
# - Output directory: public
```

**Option B: Using Vercel Web Dashboard**
1. Go to https://vercel.com/new
2. Connect GitHub repository
3. Set project name to `presave`
4. Build settings:
   - Framework: Other
   - Build Command: Leave blank
   - Output Directory: `public`
5. Click Deploy

**Expected result:** `presave.blakerichardson.vercel.app` live with SSL

### Step 2: Configure Custom Domain (5 minutes)

Once Vercel deployment is live:

1. Get Vercel's CNAME target (shown in Vercel dashboard):
   - Typically: `cname.vercel-dns.com`

2. In your domain registrar (GoDaddy, Namecheap, etc.):
   - Create CNAME record:
     - Host: `presave`
     - Points to: `cname.vercel-dns.com`
   - Or use Vercel's in-dashboard domain setup

3. Verify in Vercel dashboard that domain is connected

4. SSL certificate auto-issued by Vercel (~5-15 minutes after CNAME propagates)

### Step 3: Verify Deployment (2 minutes)

```bash
# Check if domain resolves
curl -I https://presave.blakerichardson.com

# Expected:
# HTTP/2 200 OK
# date: ...
# content-length: ...
```

**Success:** Landing page loads with placeholder pre-save flow

### Step 4: Update Issue [JGF-1828](/JGF/issues/JGF-1828) with Live URL

Post in the issue comment:
```
Deployment complete:
- URL: https://presave.blakerichardson.com
- Vercel project: presake.blakerichardson.vercel.app
- SSL: Active (auto-renewed)

Ready for monitoring setup (JGF-1842) and page build integration (JGF-1825).
```

## File Structure

- **public/index.html** — Placeholder landing page (Spotify-inspired pre-save UI)
- **api/index.js** — Health check endpoint for monitoring
- **vercel.json** — Vercel configuration (static + serverless)
- **package.json** — Node 18+ environment spec

## Environment Variables (Optional)

If you need to pass configuration at deploy time, add to Vercel dashboard:

```
NODE_ENV=production
```

(No secrets needed for initial deployment)

## Rollback

If needed, revert to previous Vercel deployment:
1. Vercel dashboard → Project → Deployments
2. Select previous green deployment
3. Click "Promote to Production"

## Next Steps

Once deployment is live:
1. ✅ Notify [JGF-1842](/JGF/issues/JGF-1842) with live URL
2. ✅ Monitoring deploy (health checks, uptime alerts)
3. ✅ Page build handoff to [JGF-1825](/JGF/issues/JGF-1825)
4. ✅ Launch by 2026-06-08 EOD

## Troubleshooting

**Deployment fails:** Check Vercel build logs in dashboard
**Domain doesn't resolve:** Verify CNAME in registrar (propagation can take 30 min)
**SSL not showing:** Wait 15 min after CNAME; refresh Vercel dashboard
**Need to rebuild:** Run `vercel --prod --yes` again

---

**Timeline:** Deployment + DNS = 30 min total  
**Hard deadline:** 2026-06-08 EOD  
**Current blocker:** Vercel authentication (requires account with CLI or web dashboard access)
