/* ============================================
   EnerOS · 能枢OS — 浅色炫技交互脚本
   Canvas 电网粒子 · 滚动显现 · 数字计数 · 卡片光晕
   ============================================ */

(function () {
'use strict';

const isTouch = window.matchMedia('(hover: none)').matches || window.innerWidth <= 768;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ===== 1. 加载动画淡出 ===== */
window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    if (loader) setTimeout(() => loader.classList.add('hidden'), 600);
});

/* ===== 2. 滚动进度条 + 导航栏状态 ===== */
const bar = document.getElementById('scrollProgress');
const nav = document.getElementById('nav');
function onScroll() {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const p = h > 0 ? (window.scrollY / h) * 100 : 0;
    if (bar) bar.style.width = p + '%';
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ===== 3. 导航菜单（移动端） ===== */
const navToggle = document.getElementById('navToggle');
const navLinksWrap = document.querySelector('.nav-links-wrap');
if (navToggle && navLinksWrap) {
    navToggle.addEventListener('click', () => navLinksWrap.classList.toggle('open'));
    navLinksWrap.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => navLinksWrap.classList.remove('open'));
    });
}

/* ===== 3b. 滑动指示器 + 滚动监听（scrollspy）===== */
const spyLinks = Array.from(document.querySelectorAll('.nav-links a[data-spy]'));
const indicator = document.getElementById('navIndicator');
const linksWrap = document.querySelector('.nav-links-wrap');

function moveIndicatorTo(link) {
    if (!indicator || !linksWrap || !link) return;
    const wrapRect = linksWrap.getBoundingClientRect();
    const aRect = link.getBoundingClientRect();
    indicator.style.left = (aRect.left - wrapRect.left) + 'px';
    indicator.style.width = aRect.width + 'px';
    indicator.classList.add('active');
}

function setActiveSpy(id) {
    let found = false;
    spyLinks.forEach(a => {
        const match = a.getAttribute('href') === '#' + id;
        a.classList.toggle('active', match);
        if (match) { moveIndicatorTo(a); found = true; }
    });
    if (!found && indicator) indicator.classList.remove('active');
}

let currentSpyId = '';
spyLinks.forEach(a => {
    a.addEventListener('mouseenter', () => moveIndicatorTo(a));
});
if (linksWrap) {
    linksWrap.addEventListener('mouseleave', () => {
        const active = spyLinks.find(a => a.getAttribute('href') === '#' + currentSpyId);
        if (active) moveIndicatorTo(active);
        else if (indicator) indicator.classList.remove('active');
    });
}

const spyTargets = spyLinks
    .map(a => document.getElementById(a.getAttribute('href').slice(1)))
    .filter(Boolean);

if ('IntersectionObserver' in window && spyTargets.length) {
    const spyIo = new IntersectionObserver((entries) => {
        let best = null, bestTop = Infinity;
        entries.forEach(e => {
            if (e.isIntersecting) {
                const r = e.target.getBoundingClientRect();
                if (r.top < bestTop && r.top >= -window.innerHeight * 0.4) {
                    bestTop = r.top; best = e.target;
                }
            }
        });
        if (best) {
            currentSpyId = best.id;
            setActiveSpy(best.id);
        }
    }, { rootMargin: '-80px 0px -55% 0px', threshold: 0 });
    spyTargets.forEach(t => spyIo.observe(t));
}

window.addEventListener('load', () => {
    setTimeout(() => { if (spyLinks[0]) moveIndicatorTo(spyLinks[0]); }, 500);
});
window.addEventListener('resize', () => {
    const active = spyLinks.find(a => a.classList.contains('active')) || spyLinks[0];
    if (active) moveIndicatorTo(active);
});

/* ===== 4. HERO 电网粒子背景（浅色版） ===== */
const canvas = document.getElementById('gridCanvas');
if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    let nodes = [], pulses = [];
    let mouse = { x: -9999, y: -9999 };
    let w = 0, h = 0;

    const NODE_COUNT = window.innerWidth < 700 ? 34 : 60;
    const MAX_DIST = 165;
    const COLORS = ['#0066ff', '#7c4dff', '#00b8d4', '#00d4aa'];

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initNodes() {
        nodes = [];
        for (let i = 0; i < NODE_COUNT; i++) {
            nodes.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.35,
                r: Math.random() * 1.6 + 0.6,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                pulse: Math.random() * Math.PI * 2
            });
        }
    }

    function hexToRgba(hex, a) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${a})`;
    }

    function spawnPulse() {
        if (nodes.length < 2) return;
        const a = nodes[Math.floor(Math.random() * nodes.length)];
        let best = null, bestD = Infinity;
        for (const n of nodes) {
            if (n === a) continue;
            const d = Math.hypot(n.x - a.x, n.y - a.y);
            if (d < MAX_DIST * 1.4 && d < bestD) { bestD = d; best = n; }
        }
        if (best) pulses.push({
            fx: a.x, fy: a.y, tx: best.x, ty: best.y, t: 0,
            speed: 0.018 + Math.random() * 0.022,
            color: a.color
        });
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);

        // 更新节点
        for (const n of nodes) {
            n.x += n.vx; n.y += n.vy; n.pulse += 0.03;
            const dx = n.x - mouse.x, dy = n.y - mouse.y;
            const md = Math.hypot(dx, dy);
            if (md < 130 && md > 0) { n.x += (dx / md) * 0.7; n.y += (dy / md) * 0.7; }
            if (n.x < 0) n.x = w; if (n.x > w) n.x = 0;
            if (n.y < 0) n.y = h; if (n.y > h) n.y = 0;
        }

        // 连接线
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i], b = nodes[j];
                const d = Math.hypot(a.x - b.x, a.y - b.y);
                if (d < MAX_DIST) {
                    const alpha = (1 - d / MAX_DIST) * 0.16;
                    ctx.strokeStyle = hexToRgba(a.color, alpha);
                    ctx.lineWidth = 0.7;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }

        // 节点
        for (const n of nodes) {
            const glow = 0.6 + Math.sin(n.pulse) * 0.4;
            const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 7);
            grad.addColorStop(0, hexToRgba(n.color, 0.4 * glow));
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r * 7, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = n.color;
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
            ctx.fill();
        }

        // 电流脉冲
        for (let i = pulses.length - 1; i >= 0; i--) {
            const p = pulses[i];
            p.t += p.speed;
            if (p.t >= 1) { pulses.splice(i, 1); continue; }
            const x = p.fx + (p.tx - p.fx) * p.t;
            const y = p.fy + (p.ty - p.fy) * p.t;
            const tailLen = 0.18;
            const tx = p.fx + (p.tx - p.fx) * Math.max(0, p.t - tailLen);
            const ty = p.fy + (p.ty - p.fy) * Math.max(0, p.t - tailLen);
            const tg = ctx.createLinearGradient(tx, ty, x, y);
            tg.addColorStop(0, 'transparent');
            tg.addColorStop(1, p.color);
            ctx.strokeStyle = tg;
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(tx, ty); ctx.lineTo(x, y);
            ctx.stroke();

            ctx.fillStyle = p.color;
            ctx.shadowBlur = 14;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(x, y, 2.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        requestAnimationFrame(draw);
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { resize(); initNodes(); }, 200);
    });
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('mouseout', () => { mouse.x = -9999; mouse.y = -9999; });

    resize(); initNodes(); draw();
    setInterval(() => {
        const count = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) spawnPulse();
    }, 550);
}

/* ===== 5. 卡片鼠标光晕跟随 ===== */
if (!isTouch) {
    const glowCards = document.querySelectorAll(
        '.problem-card, .philo-card, .cap-card, .future-card'
    );
    glowCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100) + '%');
            card.style.setProperty('--my', ((e.clientY - rect.top) / rect.height * 100) + '%');
        });
    });
}

/* ===== 6. 滚动显现动画 ===== */
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
    reveals.forEach(el => io.observe(el));
} else {
    reveals.forEach(el => el.classList.add('visible'));
}

/* 路线图时间线容器整体显现，触发内部错峰 */
const roadmapTimeline = document.querySelector('.roadmap-timeline');
if (roadmapTimeline && 'IntersectionObserver' in window) {
    const rio = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                rio.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    rio.observe(roadmapTimeline);
}

/* ===== 7. 数字计数动画 ===== */
const nums = document.querySelectorAll('.stat-num[data-target]');
if ('IntersectionObserver' in window) {
    const nio = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseInt(el.dataset.target, 10);
            const suffix = el.dataset.suffix || '';
            const duration = 1600;
            const start = performance.now();
            function step(now) {
                const p = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.round(target * eased) + suffix;
                if (p < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
            nio.unobserve(el);
        });
    }, { threshold: 0.5 });
    nums.forEach(n => nio.observe(n));
} else {
    nums.forEach(n => { n.textContent = n.dataset.target + (n.dataset.suffix || ''); });
}

/* ===== 8. 平滑锚点滚动 ===== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const id = this.getAttribute('href');
        if (id === '#' || id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
    });
});

/* ===== 9. HERO 文字入场 ===== */
window.addEventListener('load', () => {
    const heroReveals = document.querySelectorAll('.hero .reveal');
    heroReveals.forEach(el => {
        const d = parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0;
        setTimeout(() => el.classList.add('visible'), 100 + d * 1000);
    });
});

})();
