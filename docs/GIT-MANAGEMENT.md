# EnrichCo Git Management Guide

## Organization

- **GitHub Org:** [EnrichOS19](https://github.com/EnrichOS19)
- **Plan:** GitHub Team ($4/user/month) — required for branch protection on private repos
- **Owner:** seanncl (Sean Nguyen)

---

## Repository Map

### Active Product Repos

| Repo | Product | Description | Status |
|------|---------|-------------|--------|
| `Mango-POS-Offline-Winsurf` | **Mango Biz** | Core salon POS — Electron, offline-capable, Turborepo monorepo | Active development |
| `mango-connect` | **Mango Connect** | Communication platform — SMS, email, campaigns, AI chat | Active development |
| `mango-terminal-hub` | **Mango Terminal** | Payment terminal hub | Active development |
| `imsnext` | **IMS Next** | Internal management system for support team | Active development |

### Supporting Repos

| Repo | Description | Status |
|------|-------------|--------|
| `ralph` | AI coding agent for Mango Biz | Active |
| `Marketing-AI-Agent` | Marketing automation agent | Active |
| `mango-pos-system` | POS system module | Active |

### Legacy / Reference Repos

| Repo | Description | Status |
|------|-------------|--------|
| `Mango-Biz` | Earlier Mango Biz version | Archived reference |
| `mangobiz` | Original Mango Biz | Archived reference |
| `mango-bloom-store` | Bloom store prototype | Archived reference |
| `mango-staff-flow` | Staff management prototype | Archived reference |
| `v0-salon-frontdesk-ux` | Frontdesk UX prototype (v0) | Archived reference |

---

## Team Structure

### Teams & Permissions

| Team | Permission | Purpose | Members |
|------|-----------|---------|---------|
| **Core** | Write + PR required | Senior devs working on Mango Biz & Connect | *(assign as needed)* |
| **Frontend** | Write + PR required | Frontend developers | *(assign as needed)* |
| **Review Only** | Read | New team members studying the codebase | *(assign as needed)* |

**Owner (admin):** seanncl only. No one else gets admin access.

### Adding Team Members

```bash
# Add a member to the org (sends invite)
gh api -X POST orgs/EnrichOS19/invitations -f invitee_id=<USER_ID> -f role=direct_member

# Add to a team
gh api -X PUT orgs/EnrichOS19/teams/<team-slug>/memberships/<username> -f role=member
```

### Onboarding Flow

1. **Week 1-2:** Add to `Review Only` — read access to study the codebase
2. **Week 3+:** Promote to `Frontend` or `Core` based on role and readiness
3. All promotions require Sean's approval

---

## Branch Strategy

### Branch Naming

```
main                          # Production-ready code
feature/<name>                # New features
fix/<name>                    # Bug fixes
ralph/<module>                # AI agent work branches
hotfix/<name>                 # Urgent production fixes
```

### Rules

- **`main` is protected** — no direct pushes
- All changes go through **Pull Requests**
- PRs require **at least 1 review** before merge
- **Squash merge** preferred for clean history
- Delete branches after merge

### Branch Protection (to configure)

```bash
# Apply to each active repo
gh api -X PUT repos/EnrichOS19/<repo>/branches/main/protection \
  -f "required_pull_request_reviews[required_approving_review_count]=1" \
  -f "required_pull_request_reviews[dismiss_stale_reviews]=true" \
  -f "enforce_admins=false" \
  -f "required_status_checks=null" \
  -F "restrictions=null"
```

---

## Workflow

### For Developers

1. Clone the repo from the org URL:
   ```bash
   git clone https://github.com/EnrichOS19/<repo>.git
   ```
2. Create a feature branch:
   ```bash
   git checkout -b feature/my-feature
   ```
3. Make changes, commit with clear messages
4. Push and open a PR against `main`
5. Request review from a Core team member
6. Address feedback, then merge (squash)

### Commit Messages

Follow conventional commits:
```
feat(module): add new feature
fix(module): fix specific bug
refactor(module): restructure without behavior change
docs: update documentation
test: add or update tests
chore: maintenance tasks
```

### For AI Agents (Ralph, etc.)

- AI agents work on `ralph/<module>` branches
- Same PR process — all agent work gets human review before merge
- Agent commits should include context in the commit body

---

## CODEOWNERS

Each active repo should have a `CODEOWNERS` file at the root:

```
# Default — all changes require Core team review
* @EnrichOS19/core

# Frontend-specific paths
/apps/ @EnrichOS19/frontend
/packages/ui/ @EnrichOS19/frontend
/src/components/ @EnrichOS19/frontend
```

---

## Security Policies

### Access Control
- **No outside collaborators** on org repos — all access goes through Teams
- **2FA required** for all org members (enable in org settings)
- **SSH keys or personal access tokens** — no password auth
- Rotate tokens quarterly

### Secrets & Environment
- **Never commit secrets** — use `.env` files (gitignored) or GitHub Secrets
- Supabase keys, API tokens, etc. go in GitHub Secrets for CI/CD
- Local `.env` files should have a `.env.example` template committed

### Repo Visibility
- All product repos are **private**
- No repo goes public without Sean's explicit approval

---

## Local Setup (Developer Workstation)

### Mango Biz

```bash
# Clone
git clone https://github.com/EnrichOS19/Mango-POS-Offline-Winsurf.git Mango-Biz
cd Mango-Biz

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Fill in Supabase keys and other config

# Start development
pnpm dev
```

### Mango Connect

```bash
git clone https://github.com/EnrichOS19/mango-connect.git
cd mango-connect
pnpm install
cp .env.example .env
pnpm dev
```

---

## Repo Maintenance

### Archiving Legacy Repos

Legacy repos should be archived (read-only) to prevent accidental work:

```bash
gh repo archive EnrichOS19/<repo> --yes
```

### Renaming Repos

If a repo name doesn't match the product name:

```bash
gh repo rename <new-name> --repo EnrichOS19/<old-name>
```

**Note:** `Mango-POS-Offline-Winsurf` should eventually be renamed to `mango-biz` for consistency. This will break existing local clones' remotes — coordinate with the team before renaming.

---

## Contact

- **All access requests:** Sean Nguyen (seanncl)
- **Technical questions:** Javis (CTO / AI)
- **Emergency access:** Sean only

---

*Last updated: 2026-01-27*
