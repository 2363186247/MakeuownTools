# 🛠️ Make Your Own Tools

[![Live Demo](https://img.shields.io/badge/Live_Demo-Play_Now-10B981?style=for-the-badge)](https://makeuowntools.dpdns.org)
[![Astro](https://img.shields.io/badge/Built_with-Astro-FF5D01?style=for-the-badge&logo=astro)](https://astro.build)

A blazing-fast, ad-free collection of production calculators and utilities, built for developers and hardcore gamers. Everything runs locally in your browser with zero latency—no API calls, no tracking, no nonsense.

👉 **[Try it live here: makeuowntools.dpdns.org](https://makeuowntools.dpdns.org)**

## 📊 Tools Included

### 1. 🧠 LLM VRAM Estimator Pro

**Search Scenarios:**
- How much VRAM do I need to run Llama 3.1, Mistral 8x7B, or open-source LLM inference?
- Calculating GPU memory for fine-tuning with LoRA on a single RTX 4090 or multiple A100s
- Quantization strategy planner: 4-bit GGUF, 8-bit, fp16, or full precision?
- Cost estimation for cloud GPU inference (vLLM, Ollama) on AWS, Azure, or local RTX cards

**Live VRAM Calculator for:**
- Meta's Llama 3 / Llama 3.1 / Llama 2 series (7B, 13B, 70B variants)
- Mistral AI 7B, Mixtral 8x7B, 8x22B
- Open-source models on Hugging Face (auto-detect from model config)
- Linear power scaling and quantized inference paths
- Secure token support for gated models (Llama-3, LlaVA, etc.)

### 2. 🏭 Satisfactory Target Production Calculator

**Search Scenarios:**
- How many iron plates per minute do I need to produce 30 modular frames?
- Smelter and refinery setup calculator for end-game production lines
- Power consumption and raw material input planner for factory optimization
- By-product routing: when my production line creates unwanted slag or residual fluid

**Production Solver for:**
- Early-game ore smelting and foundry chains
- Late-game complex recipes: motors, computers, automated wire assembly
- FICSIT production efficiency targets (slugs, rocket parts, space elevator components)
- Closed-loop byproduct handling and fluid reclamation
- Update 8+ balance with neural modulators and particle accelerators

### 3. 🐳 Docker Compose Generator

**Search Scenarios:**
- Generate production-ready docker-compose.yml for app + database + reverse proxy stack
- Create LEMP/MEAN/JAMstack stacks (Nginx/Caddy + Node.js/Python + MySQL/Postgres)
- One-command Docker deployment with HTTPS, SSL renewal, and service orchestration
- Multi-container topology planner: API server + Redis cache + job queue + monitoring

**Stack Builder with:**
- Pre-built templates: WordPress + MySQL + Nginx, Directus + Postgres + Caddy, Metabase + MariaDB
- Custom app deployments: Ghost, Joomla, MediaWiki, Drupal, BookStack, Snipe-IT
- Reverse proxy selector (Nginx, Caddy, Traefik) with health checks and load balancing
- SSL/TLS automation with Let's Encrypt and auto-renewal scheduling
- Multi-service topology support (app + database + cache in one compose file)

### 4. 🔄 Reverse Proxy Config Generator

**Search Scenarios:**
- How do I proxy a Node.js/Python/React app behind Nginx with HTTPS and WebSocket support?
- Caddy vs. Traefik: generate config and compare for your use case
- Rate limiting and DDoS protection: fail2ban + Cloudflare + connection limiting profiles
- Upload size limits, CORS headers, compression (gzip + brotli), and security headers tuning

**Reverse Proxy Automator for:**
- Nginx configuration with HTTP/2, ALPN, and upstream health checks
- Caddy with plug-and-play automatic HTTPS and JSON marshaling
- Traefik with Docker provider and dynamic middleware injection
- Multi-environment hardening: 🟢 Compatible (balanced), 🟡 Balanced (prod), 🔴 Strict (high-traffic)
- One-click docker-compose bundle generation with optional database and cache layers
- WAF protection packs: Cloudflare real-IP whitelisting, fail2ban jail integration, limit_conn profiles

### 5. 🖨️ 3D Printing Filament Navigator

**Search Scenarios:**
- How much filament weight (grams) should I buy for a 1.5 kg spool vs. 5 kg bulk?
- Calculating remaining meter length from spool weight after print jobs
- Cost-per-quality comparison: does this exotic resin filament beat budget PLA?

**Filament Calculator for:**
- All common materials: PLA, PETG, ABS, TPU/TPE, PA6/PA12, PMMA, PET, PBT, PP, HIPS, PVA
- Real-time weight-to-length conversion (density-based, material-specific)
- Spool profiles: 250g miniatures, 500g standard, 1 kg industrial, 5 kg bulk reels
- Durability ratings and post-processing recommendations

### 6. 💾 NAS & RAID Storage Calculator

**Search Scenarios:**
- RAID 5 vs. RAID 6 vs. RAID 10 vs. ZFS RAID-Z: which gives best capacity and fault tolerance?
- Usable capacity planner: 10x 8TB drives in RAID-5 = how many TB after parity?
- Homelab datahoarder setup: Synology, TrueNAS, Unraid, or raw Linux—which RAID level?
- Disk failure risks: what's my N+1 protection with RAID 1, RAID 6, or RAID-Z2?

**Storage Architect with:**
- RAID configurations: 0 (striping), 1 (mirroring), 5 (striping + parity), 6 (dual-parity), 10 (striped mirrors)
- ZFS RAID-Z variants: RAID-Z1 (single-parity), Z2 (dual-parity), Z3 (triple-parity)
- Real usable capacity calculator: raw → formatted → actual available space
- Fault tolerance matrix: which drives can fail without data loss?
- Quick presets and snapshots for common builds (10x8TB RAID-5 datacenter, 8x4TB RAID-10 homelab)

---

## ⚡ Why Make Your Own Tools?

✅ **Zero Latency** – Results compute in milliseconds in your browser  
✅ **No Sign-up Required** – No accounts, no emails, no spam  
✅ **Production-Ready** – Not toys; real calculations for real deployments  
✅ **Open Source & Auditable** – Built with Astro, TypeScript, runs pure static  
✅ **Long-Tail SEO** – Each tool gets deep search coverage for specific problems  

---

## 🏗️ Architecture

- **Framework:** Astro (SSG, type-safe, ultra-fast)
- **Styling:** Utility-first CSS + Tailwind patterns
- **Data:** Static calculations, zero dependencies
- **SEO:** 1500+ dynamically generated long-tail pages
- **Deployment:** GitHub Pages / Netlify / any static host

---

## 📝 License

MIT — Use, modify, and share freely.

---

**Stuck on a calculation? Need faster deployment?** → [Deploy your own tools instance](https://github.com/you/make-your-own-tools)

