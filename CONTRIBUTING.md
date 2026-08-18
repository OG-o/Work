# Contributing to Ubuntu Cloud PC

Thank you for your interest in contributing to the **Ubuntu Cloud PC** open-source project!

---

## 🛠️ Development & Testing

1. **Fork and Clone** the repository:
   ```bash
   git clone https://github.com/OG-o/Work.git
   cd Work
   ```

2. **Run Installer**:
   ```bash
   ./setup.sh
   ```

3. **Manage the Stack**:
   ```bash
   cloudpc status
   cloudpc start
   cloudpc stop
   cloudpc restart
   cloudpc logs
   ```

---

## 📋 Guidelines
- Keep shell scripts compatible with standard POSIX / Bash.
- Avoid introducing proprietary dependencies.
- Ensure all desktop applications include software rasterizer / container flags (`--no-sandbox --disable-gpu --disable-dev-shm-usage`).
- Test changes on mobile touch screens before submitting pull requests.
