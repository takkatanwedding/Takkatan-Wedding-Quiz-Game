/* ปุ่มเต็มจอ + ตัวช่วยแชร์ลิงก์ (ใช้ร่วมกันทั้งหน้าผู้จัดและหน้าผู้เล่น) */
(function () {
  const d = document, root = d.documentElement;
  const reqFs = root.requestFullscreen || root.webkitRequestFullscreen;
  const exitFs = d.exitFullscreen || d.webkitExitFullscreen;
  const isFs = () => !!(d.fullscreenElement || d.webkitFullscreenElement);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  function toast(msg, ms) {
    let t = d.getElementById('ui-toast');
    if (!t) { t = d.createElement('div'); t.id = 'ui-toast'; t.setAttribute('role', 'status'); d.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toast.tm); toast.tm = setTimeout(() => t.classList.remove('on'), ms || 2600);
  }

  function toggleFs() {
    if (!reqFs) {
      // iPhone Safari ไม่รองรับเต็มจอสำหรับหน้าเว็บ ให้เพิ่มลงหน้าจอโฮมแทน
      toast(isIOS ? 'iPhone: กดปุ่มแชร์ของ Safari แล้วเลือก "เพิ่มไปยังหน้าจอโฮม" เพื่อเล่นแบบเต็มจอ' : 'เบราว์เซอร์นี้ไม่รองรับโหมดเต็มจอ', 5000);
      return;
    }
    try {
      const p = isFs() ? exitFs.call(d) : reqFs.call(root);
      if (p && p.catch) p.catch(() => toast('เปิดโหมดเต็มจอไม่สำเร็จ'));
    } catch (e) { toast('เปิดโหมดเต็มจอไม่สำเร็จ'); }
  }

  function syncBtn() {
    const b = d.getElementById('fs-btn'); if (!b) return;
    const on = isFs();
    b.textContent = on ? '🗗' : '⛶';
    b.setAttribute('aria-label', on ? 'ออกจากโหมดเต็มจอ' : 'เต็มจอ');
    b.title = on ? 'ออกจากเต็มจอ (Esc)' : 'เต็มจอ (กด F)';
  }

  function mount() {
    if (standalone) return;   // เปิดจากหน้าจอโฮมอยู่แล้ว (เต็มจออยู่แล้ว)
    const b = d.createElement('button');
    b.id = 'fs-btn'; b.type = 'button';
    b.className = d.body.dataset.sfx === 'top' ? 'fs-top' : 'fs-bottom';
    b.onclick = e => { e.stopPropagation(); toggleFs(); };
    d.body.appendChild(b); syncBtn();
  }
  d.addEventListener('fullscreenchange', syncBtn);
  d.addEventListener('webkitfullscreenchange', syncBtn);
  // กด F เพื่อสลับเต็มจอ (ไม่ทำงานตอนพิมพ์ในช่องกรอก)
  addEventListener('keydown', e => {
    if (e.key !== 'f' && e.key !== 'F') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target; if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if (!reqFs) return;
    toggleFs();
  });
  if (d.body) mount(); else addEventListener('DOMContentLoaded', mount);

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
    try {
      const ta = d.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      d.body.appendChild(ta); ta.focus(); ta.select();
      const ok = d.execCommand('copy'); ta.remove(); return ok;
    } catch (e) { return false; }
  }
  // แชร์ผ่านเมนูของเครื่อง (มือถือ) ถ้าไม่มีก็คัดลอกลิงก์ คืนค่า 'shared' | 'copied' | 'cancel' | 'fail'
  async function shareLink(url, title, text) {
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); return 'shared'; }
      catch (e) { if (e && e.name === 'AbortError') return 'cancel'; }
    }
    return (await copyText(url)) ? 'copied' : 'fail';
  }
  window.UI = { toast, copyText, shareLink, toggleFullscreen: toggleFs, canShare: !!navigator.share };
})();
