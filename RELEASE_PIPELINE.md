# Blake Richardson Pre-Save Release Pipeline

## Timeline Overview

```
Today (2026-06-05 EOD)
  ↓
  [JGF-1828: Vercel Deployment + DNS] ← BLOCKIN WAIT FOR MANUAL VERCEL ACCESS
  ↓
2026-06-06 EOD (DNS propagation + SSL cert)
  ↓
  [JGF-1842: Uptime Monitoring] → Auto-unblock when JGF-1828 completes
  [JGF-1825: Page Build & Launch] → Auto-unblock when JGF-1828 completes
  ↓
2026-06-08 EOD (Hard Launch Deadline)
```

## Issue Dependency Chain

### JGF-1828: Domain & Infrastructure Setup (⏳ BLOCKED)
**Status:** blocked (awaiting manual Vercel deployment)  
**Assignee:** Founding Engineer (@0b9fd4d8)  
**Blocker:** Requires Vercel CLI authentication  

**Deliverables:**
- ✅ Git repo with Vercel-ready structure
- ✅ Placeholder landing page
- ✅ Health check API endpoint
- ✅ Vercel + DNS configuration guide
- 🚫 Manual Vercel deployment (requires external credentials)
- 🚫 DNS CNAME configuration (requires domain registrar access)
- 🚫 SSL certificate provisioning (auto by Vercel once CNAME active)

**Unblock action:**
```
1. Deploy to Vercel with CLI or web dashboard
2. Configure DNS CNAME at domain registrar
3. Post live URL in issue comment
```

### JGF-1842: Uptime Monitoring (⏳ BLOCKED by JGF-1828)
**Status:** todo (blocked by JGF-1828)  
**Assignee:** Founding Engineer (@0b9fd4d8)  
**Blocker:** Needs live URL from JGF-1828  

**Deliverables:**
- UptimeRobot monitor for presave.blakerichardson.com
- 5-minute heartbeat check
- Keyword validation (presense of "Blake Richardson")
- Slack + email alerts on downtime
- Public status page

**Timeline:** 2 minutes to deploy once URL confirmed

### JGF-1825: Page Build & Launch (⏳ BLOCKED by JGF-1828)
**Status:** todo (blocked by JGF-1828)  
**Assignee:** Frontend/Build Team (@3672d428)  
**Blocker:** Needs infrastructure ready + live domain  

**Deliverables:**
- Replace placeholder with actual landing page
- Add DSP buttons (Spotify, Apple Music, Amazon Music, YouTube Music)
- Email capture (release notification + fan club opt-in)
- Social share integration
- Fan Engage profile link
- Deploy to presave.blakerichardson.com

**Timeline:** Dependent on page design readiness (separate milestone)

## Critical Path

1. **JGF-1828 unblock** (5 min Vercel deploy + 30 min DNS/SSL) = **35 min critical path**
2. Once JGF-1828 live → JGF-1842 (2 min) → confirm uptime
3. Once JGF-1828 live + monitoring green → JGF-1825 can deploy
4. Launch once page build complete (by 2026-06-08 EOD)

## Rollback Plan

If presave.blakerichardson.com fails:

1. **Revert to previous Vercel deployment:**
   ```
   Vercel dashboard → Deployments → previous green → Promote to Production
   ```

2. **If DNS issue:** 
   ```
   Remove CNAME from registrar
   Use Vercel fallback URL: presave.blakerichardson.vercel.app
   ```

3. **If SSL fails:**
   ```
   Vercel handles auto-renewal; manual cert re-issue via Vercel dashboard
   ```

## Monitoring & Alerts

Once JGF-1842 deploys:
- UptimeRobot dashboard (public link TBD in JGF-1842)
- Slack channel: #blakerichardson-presave (alerts configured)
- Email: ops team on critical downtime

## Acceptance Criteria (All Issues)

- [x] Infrastructure ready (JGF-1828 — code only, awaiting deployment)
- [ ] Domain live with valid SSL (JGF-1828 — manual Vercel)
- [ ] Monitoring active and alerting (JGF-1842)
- [ ] Landing page build complete (JGF-1825)
- [ ] All DSP integrations tested
- [ ] Load test passing (JGF-1843 ✅ done)

## Handoff Notes

**For whoever manually deploys JGF-1828:**
- See DEPLOYMENT_GUIDE.md for step-by-step instructions
- Expected time: 35 minutes total
- No additional code changes needed; just CLI commands + registrar access

**For JGF-1842 executor:**
- Get live URL from JGF-1828 comment
- Create UptimeRobot monitor with provided config
- Test alert channels (Slack + email)
- Post status page link in issue

**For JGF-1825 executor:**
- Clone repo once JGF-1828 is live
- Replace public/index.html with actual design
- Git push triggers auto-deploy to Vercel
- Verify at presave.blakerichardson.com
- Coordinate launch with content/DSP teams
