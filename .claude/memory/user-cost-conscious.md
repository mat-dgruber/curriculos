---
name: Cost-Conscious Infrastructure
description: User strongly prefers free-tier/self-hosted infrastructure. Has old PC at home for self-hosting DB. Rejects all paid subscriptions and trials.
type: user
---

User is cost-conscious when it comes to infrastructure. Chose Oracle Cloud Always Free (VM ARM with 200GB storage) over paid alternatives like Google Cloud ($6-7/month) or Railway Hobby ($5/month).

**Key traits:**
- Willing to invest time in self-hosting (Docker, VM setup) to save money
- Researches alternatives thoroughly — asked about Supabase, Neon, Firebase, Google Cloud, Oracle Cloud before deciding
- Prefers "free forever" (Oracle Always Free) over trials that expire (Google Cloud 1-month free)
- Understands the tradeoff: self-hosting means more ops work, but values $0 cost
- Has an old PC at home sitting idle — interested in repurposing it as a home PostgreSQL server to avoid DB hosting costs entirely
- Open to running PostgreSQL on local hardware (not just cloud VMs) — Linux install + port forwarding or Tailscale/WireGuard for remote access

**How to apply:** When recommending infrastructure, always consider: (1) Oracle Always Free, (2) self-hosting on their home PC as a DB server, (3) other free tiers. Never suggest paid options without acknowledging they can self-host. When discussing DB infrastructure, mention the home PC option alongside Oracle VM.
