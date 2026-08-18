# 🛠️ Ubuntu Cloud PC Troubleshooting & Self-Healing Guide

Quick solutions for common questions and issues.

---

## 1. 🔄 "Failed to connect to server"
If noVNC displays a connection error:
1. Run the status command in terminal:
   ```bash
   cloudpc status
   ```
2. If any component is stopped, restart the stack:
   ```bash
   cloudpc restart
   ```
3. Get the latest live URL:
   ```bash
   cloudpc url
   ```

---

## 2. ⌨️ Phone Keyboard Not Appearing
- **Cause**: Mobile browsers only open virtual keyboards when an input box is focused.
- **Solution**: Tap the **`[ ⌨️ Keyboard ]`** button in the **top-right floating toolbar** on your screen. This focuses the hidden mobile bridge and immediately opens your Gboard / Samsung keyboard.
- Alternatively, tap the **`[ 💬 Type/Paste ]`** button to paste text or type in a popup dialog.

---

## 3. 🔊 No Sound Coming from Phone
- **Cause**: Mobile browsers block audio autoplay until the user explicitly interacts with the page.
- **Solution**: Tap the **`[ 🔊 Audio ]`** button in the top-right toolbar. The button will turn green and say **`🔊 Audio: ON`**, enabling live sound streaming to your phone.

---

## 4. 🔍 Desktop Resolution or Zoom Issues on Phone
- Tap the **`[ 🔍 Fit ]`** button in the top-right toolbar to toggle responsive viewport scaling.
- In noVNC sidebar settings (left pull-out tab), ensure **Scaling Mode** is set to **"Remote Resizing"** or **"Local Scaling"**.

---

## 5. 🌐 Finding Your Active Web Access Link
To view your active Cloudflare tunnel URL anytime:
```bash
cloudpc url
```

---

## 📋 Viewing Real-Time Logs
To inspect system, watchdog, and tunnel logs:
```bash
cloudpc logs
```
