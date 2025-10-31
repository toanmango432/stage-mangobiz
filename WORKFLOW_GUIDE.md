# 🔄 AI-Assisted Development Workflow Guide

**Project:** Mango Salon Center POS  
**Date:** October 31, 2025  
**Status:** Active Development

---

## 📁 **Single Source of Truth**

```
Main Project Folder:
/Users/seannguyen/Winsurf built/Mango-Salon-Center--new-official-version

Git Repository:
https://github.com/seanncl/Mango-Salon-Center--new-official-version.git
```

**⚠️ IMPORTANT:** Always work in this folder only. Other folders are archives.

---

## 🤖 **Working with Multiple AI Assistants**

### **Rule #1: Never Run Both Simultaneously**
```
❌ WRONG:  Windsurf open + Cursor open = CONFLICTS
✅ RIGHT:  Close Windsurf → Open Cursor (or vice versa)
```

### **Rule #2: Commit Before Switching**

**Before closing Windsurf:**
```bash
git add .
git commit -m "Windsurf: [What you built] - [date]"
git push origin main
```

**Before closing Cursor:**
```bash
git add .
git commit -m "Cursor: [What you built] - [date]"
git push origin main
```

### **Rule #3: Test After Switching**
After opening a different IDE:
1. Pull latest changes: `git pull origin main`
2. Check if dev server runs: `npm run dev`
3. Test critical features
4. Review what the other AI changed: `git log -5 --oneline`

---

## 🔄 **Recommended Daily Workflow**

### **Morning - Start Work:**
```bash
cd "/Users/seannguyen/Winsurf built/Mango-Salon-Center--new-official-version"
git pull origin main
git status  # Check for uncommitted work
npm run dev  # Start dev server
```

### **During Work - Frequent Commits:**
```bash
# Every significant feature/fix:
git add .
git commit -m "Descriptive message about what changed"

# Every 1-2 hours or before switching AI:
git push origin main
```

### **End of Day - Save Everything:**
```bash
git add .
git commit -m "EOD: [Summary of day's work] - $(date +%Y-%m-%d)"
git push origin main
```

---

## 🎯 **Commit Message Convention**

### **Format:**
```
[AI/Type]: [Feature/Fix] - [Details]

Examples:
✅ Windsurf: Add IndexedDB integration - Oct 30
✅ Cursor: Implement smart booking features - Oct 31
✅ Fix: Resolve customer search debounce issue
✅ Test: Verify appointment creation flow
✅ Docs: Update API reference for appointments
```

### **Types:**
- `Windsurf:` - Work done with Windsurf/Cascade
- `Cursor:` - Work done with Cursor AI
- `Fix:` - Bug fixes
- `Test:` - Testing and QA
- `Docs:` - Documentation updates
- `Refactor:` - Code refactoring
- `EOD:` - End of day checkpoint

---

## 🧪 **Testing Protocol**

### **After ANY Code Changes:**
1. ✅ Check browser console (no errors)
2. ✅ Test the feature you built
3. ✅ Test existing features (regression)
4. ✅ Check mobile responsive (if UI change)
5. ✅ Verify IndexedDB data (Application tab)

### **Before Committing:**
```bash
# Run type check
npm run build  # Should complete without errors

# Run tests (if available)
npm test

# Manual testing checklist
# - [ ] App loads
# - [ ] Book module works
# - [ ] Appointments CRUD works
# - [ ] Search works
# - [ ] Data persists
```

---

## 📊 **Current Project Status**

### **Last Major Commit:**
```
Commit: 5ee292e
Date: Oct 31, 2025
Message: Integrated development work: IndexedDB + Smart Booking Features
```

### **What's Working:**
- ✅ IndexedDB integration (Windsurf - Oct 30)
- ✅ Database initialization & seeding
- ✅ Customer search (debounced, live)
- ✅ Service selection from DB
- ✅ Appointment creation & persistence
- ✅ Smart booking features (Cursor - Oct 31)
- ✅ Conflict detection
- ✅ Staff auto-assignment
- ✅ Edit appointment modal
- ✅ Month/Agenda views

### **Next To Build:**
- [ ] Test complete booking workflow
- [ ] Implement edit appointment functionality
- [ ] Add delete/cancel appointment
- [ ] Status management (Check-in, Start, Complete)
- [ ] Coming Appointments section
- [ ] Drag & drop rescheduling

---

## 🐛 **Troubleshooting**

### **Problem: "Changes from other AI broke my work"**
**Solution:**
```bash
# See what changed:
git log -10 --oneline

# View specific commit:
git show <commit-hash>

# Rollback if needed:
git revert <commit-hash>
```

### **Problem: "Merge conflicts between AIs"**
**Solution:**
- This shouldn't happen if you follow Rule #1
- If it does: `git status` to see conflicts
- Manually resolve in VS Code/IDE
- Then: `git add .` → `git commit` → `git push`

### **Problem: "Can't remember what AI built what"**
**Solution:**
```bash
# See all commits with messages:
git log --oneline --all

# Search for specific AI's work:
git log --grep="Windsurf"
git log --grep="Cursor"
```

### **Problem: "App won't start after pulling changes"**
**Solution:**
```bash
# Reinstall dependencies:
rm -rf node_modules package-lock.json
npm install

# Clear build cache:
rm -rf dist

# Restart dev server:
npm run dev
```

---

## 🗂️ **Archive Old Folders**

### **Folders to Archive (Don't Delete Yet):**
```
~/Mango Biz Salon Center/Mango-Salon-Center--new-official-version
~/Mango Biz Salon Center/Mango-Salon-Center--new-official-version-1
```

### **Create Archive:**
```bash
# When you're confident main folder is stable:
cd ~/
mkdir "Archive - Mango POS Old Versions"
mv "Mango Biz Salon Center/Mango-Salon-Center--new-official-version" "Archive - Mango POS Old Versions/"
mv "Mango Biz Salon Center/Mango-Salon-Center--new-official-version-1" "Archive - Mango POS Old Versions/"
```

**Wait 1-2 weeks, then delete archive if not needed.**

---

## 📚 **Quick Reference**

### **Dev Server:**
```bash
cd "/Users/seannguyen/Winsurf built/Mango-Salon-Center--new-official-version"
npm run dev
# Opens at: http://localhost:5173 (or 5174, 5175 if port busy)
```

### **Git Commands:**
```bash
git status              # See what changed
git add .              # Stage all changes
git commit -m "msg"    # Commit with message
git push origin main   # Push to GitHub
git pull origin main   # Pull latest
git log --oneline      # See commit history
```

### **Testing:**
```bash
npm run build          # Production build test
npm test              # Run tests
npm run typecheck     # TypeScript check (if configured)
```

---

## ✅ **Daily Checklist**

**Morning:**
- [ ] Pull latest: `git pull origin main`
- [ ] Check status: `git status`
- [ ] Start server: `npm run dev`
- [ ] Review yesterday's commits: `git log -5`

**During Work:**
- [ ] Commit frequently (every feature/fix)
- [ ] Test after each change
- [ ] Close one AI before opening another
- [ ] Check console for errors

**End of Day:**
- [ ] Commit all work
- [ ] Push to GitHub
- [ ] Test app end-to-end
- [ ] Note any TODOs for tomorrow

---

## 🎯 **Success Metrics**

**Good Signs:**
- ✅ Git history shows clear, meaningful commits
- ✅ No uncommitted changes at end of day
- ✅ App runs without errors
- ✅ Features work as expected
- ✅ Can easily see what each AI contributed

**Warning Signs:**
- ⚠️ Lots of uncommitted files
- ⚠️ Unclear commit messages
- ⚠️ Can't remember what changed
- ⚠️ App breaks after switching AIs
- ⚠️ Multiple project folders out of sync

---

**Last Updated:** October 31, 2025  
**Current Commit:** `5ee292e`  
**Next Review:** After completing Phase 1 testing

---

**Remember:** Git is your safety net. Commit often, push regularly, test always! 🚀
