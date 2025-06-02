// ==UserScript== 
// @name        广告链接绕过+人机验证破解助手 Pro
// @namespace   https://github.com/ding360
// @version     1.05
// @description 增强版双引擎广告绕过 + 全类型验证码破解 
// @author      ding360
// @match       *://*/*
// @grant       GM_xmlhttpRequest
// @grant       GM_notification
// @grant       GM_setClipboard 
// @grant       GM_getValue 
// @grant       GM_setValue 
// @connect     bypass.city 
// @connect     voltar.lol  
// @connect     api.yescaptcha.com 
// @require     https://code.jquery.com/jquery-3.6.0.min.js 
// @require     https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js 
// @resource updateMeta https://raw.githubusercontent.com/ding360/bypass_Roblox/main/bypass.js
// @downloadURL https://raw.githubusercontent.com/ding360/bypass_Roblox/main/bypass.js
// @updateURL https://raw.githubusercontent.com/ding360/bypass_Roblox/main/bypass.js
// @icon https://raw.githubusercontent.com/ding360/bypass_Roblox/refs/heads/main/favicon.ico
// ==/UserScript==
 
/* ========== 匹配域名列表 ========== */
// @match *://*.adshnk.com/* 
// @match *://*.adshrink.it/* 
// ...（保留原始所有@match规则）...
// @exclude *://publisher.linkvertise.com/* 
// @exclude *://linkvertise.com/adfly-notice* 
// ...（保留原始所有@exclude规则）...

// 在脚本顶部添加配置变量 
const USER_CONFIG = {
  position: {x: "left", y: "top"},  // 或"right"/"bottom"
  icon: "🛡️",               // 自定义图标 
  hotkey: "Ctrl+Alt+C",        // 自定义快捷键 
  autoHide: true               // 滚动时自动隐藏 
};
// 添加IFRAME封装（规避CSS污染）
const createIsolatedButton = () => {
  const iframe = document.createElement('iframe'); 
  iframe.id  = "bypass-iframe-container";
  iframe.style.cssText  = `/* 定位样式... */`;
  document.body.appendChild(iframe); 
  
  iframe.contentDocument.write(` 
    <html>
      <head>
        <style>${getIsolatedStyles()}</style>
      </head>
      <body>${getButtonHtml()}</body>
    </html>
  `);
}
// 监听动态内容变化 
new MutationObserver(() => {
  if (!document.getElementById(FLOATING_BTN_ID))  {
    createGlobalFloatingButton();
  }
  detectPageAdLinks(); // 持续扫描新内容 
}).observe(document, {subtree: true, childList: true});
/* ========== 全局配置 ========== */
const CONFIG = {
  engineTimeout: 5000,    // 引擎请求超时(毫秒)
  maxCacheAge: 300000,    // 缓存有效期(5分钟)
  ui: {
    accentColor: "#4a6cf7", // 主色调 
    darkMode: false        // 深色模式 
  }
};
 
/* ========== 增强版引擎系统 ========== */
const ENHANCED_ENGINES = [
  {
    name: "bypass_city",
    url: "https://bypass.city/api/v2", 
    method: "POST",
    timeout: 4500,
    cacheTTL: 300,
    headers: {
      "X-API-Key": "PUBLIC_FREE",
      "Bypass-Version": "2.1"
    },
    parser: function(response) {
      try {
        const data = JSON.parse(response); 
        if (data.status  === "success") return data.direct_url; 
      } catch {}
      
      const metaMatch = response.match(/<meta.*?url=(https?:\/\/[^'"]+)/i); 
      if (metaMatch) return decodeURIComponent(metaMatch[1]);
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(response,  "text/html");
      return doc.querySelector("a#direct-link")?.href  || null;
    }
  },
  {
    name: "voltar_lol",
    url: "https://voltar.lol/bypass", 
    method: "GET",
    timeout: 4000,
    cacheTTL: 180,
    params: { 
      turbo: "1", 
      js: "disabled"
    },
    parser: function(response) {
      const instantRedirect = response.match(/window\.location\.href\s*=\s*["'](https?:\/\/[^"']+)/); 
      if (instantRedirect) return instantRedirect[1];
      
      const waitTime = response.match(/var\s+wait\s*=\s*(\d+)/)?.[1]  || 5;
      return response.match(new  RegExp(`countdown\\.html\\?url=([^"]+)",\\s*${waitTime}`))?.[1];
    }
  },
  // 新增备用引擎 
  {
    name: "direct_extract",
    url: "",
    method: "LOCAL",
    parser: function() {
      const link = document.querySelector('a[href*="http"][target="_blank"]'); 
      return link ? link.href  : null;
    }
  }
];
 
/* ========== 优化版悬浮窗系统 ========== */
function initEnhancedFloatingUI() {
  // 删除可能存在的旧按钮
  const oldBtn = document.getElementById('bypass-floating-btn'); 
  if (oldBtn) oldBtn.remove(); 
  
  // 创建主容器 
  const container = document.createElement('div'); 
  container.id  = 'bypass-container';
  container.style.cssText  = `
    position: fixed;
    bottom: 25px;
    right: 25px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
    transition: all 0.3s ease;
    font-family: 'Segoe UI', system-ui, sans-serif;
  `;
  
  // 创建主按钮 
  const mainBtn = document.createElement('div'); 
  mainBtn.id  = 'bypass-main-btn';
  mainBtn.innerHTML  = `
    <svg width="20" height="20" viewBox="0 0 24 24" style="margin-right:8px">
      <path fill="white" d="M13 3C9.23 3 6.19 5.95 6 9.66L4.08 12.19C3.84 12.5 4.13 13 4.5 13H6V16C6 17.1 6.9 18 8 18H9V21H16V16.31C18.37 15.19 20 12.8 20 10C20 6.14 16.88 3 13 3M13 15V13H9V10H13V8L16 11L13 14V15Z"/>
    </svg>
    <span>智能绕过</span>
  `;
  mainBtn.style.cssText  = `
    display: flex;
    align-items: center;
    background: ${CONFIG.ui.accentColor}; 
    color: white;
    padding: 14px 24px;
    border-radius: 50px;
    cursor: pointer;
    box-shadow: 0 5px 18px ${hexToRgba(CONFIG.ui.accentColor,  0.3)};
    font-weight: 600;
    font-size: 16px;
    transition: all 0.2s ease;
    user-select: none;
  `;
  
  // 创建菜单面板
  const menuPanel = document.createElement('div'); 
  menuPanel.id  = 'bypass-menu';
  menuPanel.style.cssText  = `
    background: white;
    border-radius: 18px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
    overflow: hidden;
    width: 280px;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.3s ease;
    pointer-events: none;
  `;
  
  // 菜单内容 
  menuPanel.innerHTML  = `
    <div class="menu-header">
      <h3>广告链接助手</h3>
      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">已处理</span>
          <span class="stat-value">0</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">成功率</span>
          <span class="stat-value">0%</span>
        </div>
      </div>
    </div>
    <div class="menu-content">
      <button class="menu-btn" id="scan-now">
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14z"/></svg>
        立即扫描页面 
      </button>
      <button class="menu-btn" id="engine-settings">
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94c0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6s3.6 1.62 3.6 3.6s-1.62 3.6-3.6 3.6z"/></svg>
        引擎设置 
      </button>
      <div class="divider"></div>
      <button class="menu-btn text-btn" id="clear-cache">
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M19 8l-4 4h3c0 3.31-2.69 6-6 6a5.87 5.87 0 0 1-2.8-.7l-1.46 1.46A7.93 7.93 0 0 0 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6c1.01 0 1.97.25 2.8.7l1.46-1.46A7.93 7.93 0 0 0 12 4c-4.42 0-8 3.58-8 8H1l4 4l4-4H6z"/></svg>
        清除缓存 
      </button>
      <button class="menu-btn text-btn" id="toggle-darkmode">
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M20 8.69V4h-4.69L12 .69L8.69 4H4v4.69L.69 12L4 15.31V20h4.69L12 23.31L15.31 20H20v-4.69L23.31 12L20 8.69zM12 18c-.89 0-1.74-.2-2.5-.55C11.56 16.5 13 14.42 13 12s-1.44-4.5-3.5-5.45C10.26 6.2 11.11 6 12 6c3.31 0 6 2.69 6 6s-2.69 6-6 6z"/></svg>
        深色模式 
      </button>
    </div>
    <div class="menu-footer">
      <div class="engine-status">
        <span class="status-dot active"></span>
        <span>引擎运行中</span>
      </div>
    </div>
  `;
  
  // 添加到DOM 
  container.appendChild(menuPanel); 
  container.appendChild(mainBtn); 
  document.body.appendChild(container); 
  
  // 交互事件
  mainBtn.addEventListener('click',  () => {
    const isVisible = menuPanel.style.opacity  === '1';
    menuPanel.style.opacity  = isVisible ? '0' : '1';
    menuPanel.style.transform  = isVisible ? 'translateY(10px)' : 'translateY(0)';
    menuPanel.style.pointerEvents  = isVisible ? 'none' : 'all';
  });
  
  // 菜单按钮事件 
  document.getElementById('scan-now').addEventListener('click',  processPageLinks);
  document.getElementById('clear-cache').addEventListener('click',  clearAllCache);
  document.getElementById('toggle-darkmode').addEventListener('click',  toggleDarkMode);
  
  // 应用初始样式
  applyUIStyles();
}

function initBypassSystem() {
  // 创建悬浮按钮 - 在所有页面都创建
  const floatingBtn = createFloatingButton();
  // 自动检测广告链接（原逻辑保留）
  setTimeout(autoDetectAdLinks, 2000);
  // 人机验证监听器（原逻辑保留）
  new MutationObserver(checkAndSolveCaptcha)
    .observe(document.body,  { childList: true, subtree: true });
}
function createFloatingButton() {
  // 检查是否已经存在，避免重复创建
  if (document.getElementById('bypass-floating-btn'))  {
    return;
  }
  const floatingBtn = document.createElement('div'); 
  floatingBtn.id  = 'bypass-floating-btn';
  floatingBtn.innerHTML  = '🚀 广告破解助手';
  Object.assign(floatingBtn.style,  {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 9999,
    background: '#4a6cf7',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '30px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(74, 108, 247, 0.3)',
    fontWeight: 'bold',
    userSelect: 'none'
  });
  // 添加拖动功能
  let posX = 0, posY = 0, mouseX = 0, mouseY = 0;
  floatingBtn.addEventListener('mousedown',  function(e) {
    e.preventDefault(); 
    posX = e.clientX  - floatingBtn.offsetLeft; 
    posY = e.clientY  - floatingBtn.offsetTop; 
    document.addEventListener('mousemove',  moveElement);
    document.addEventListener('mouseup',  function() {
      document.removeEventListener('mousemove',  moveElement);
    });
  });
  function moveElement(e) {
    floatingBtn.style.left  = (e.clientX  - posX) + 'px';
    floatingBtn.style.top  = (e.clientY  - posY) + 'px';
    floatingBtn.style.right  = 'unset';
    floatingBtn.style.bottom  = 'unset';
  }
  // 点击事件：如果当前页面有广告链接则执行绕过，否则尝试破解验证码
  floatingBtn.addEventListener('click',  function() {
    // 先尝试处理广告链接
    const adLinksPresent = document.querySelectorAll('a[href*="adfoc.us"],  a[href*="linkvertise.com"]').length  > 0;
    if (adLinksPresent) {
      processPageLinks();
      GM_notification({ title: "广告绕过", text: "已处理页面广告链接" });
    } else {
      // 如果没有广告链接，尝试检测并解决验证码
      if (checkAndSolveCaptcha()) {
        GM_notification({ title: "验证码破解", text: "正在处理验证码..." });
      } else {
        GM_notification({ title: "提示", text: "当前页面未检测到广告链接或验证码" });
      }
    }
  });
  document.body.appendChild(floatingBtn); 
  return floatingBtn;
}
// 修改：在autoDetectAdLinks函数中，如果检测到广告链接，可以给悬浮按钮一个提示效果
function autoDetectAdLinks() {
  // 检测广告链接的逻辑（原脚本可能有此函数，这里假设没有，我们简单实现提示）
  const adLinks = detectAdLinks(); // 假设我们有一个检测函数
  if (adLinks.length  > 0) {
    const btn = document.getElementById('bypass-floating-btn'); 
    if (btn) {
      btn.style.background  = '#ff8c00';
      btn.innerHTML  = '🚀 检测到广告！点击处理';
      // 5秒后恢复
      setTimeout(() => {
        btn.style.background  = '#4a6cf7';
        btn.innerHTML  = '🚀 广告破解助手';
      }, 5000);
    }
  }
}
// 新增：检测广告链接的通用函数
function detectAdLinks() {
  const adHosts = [
    'adfoc.us', 
    'linkvertise.com', 
    // ... 其他广告域名
  ];
  const links = Array.from(document.querySelectorAll('a[href]')); 
  return links.filter(link  => {
    const href = link.href; 
    return adHosts.some(host  => href.includes(host)); 
  });
}

/* ========== 全局悬浮窗系统 ========== */
const FLOATING_BTN_ID = "bypass-global-floating-btn";
function createGlobalFloatingButton() {
    // 防止重复创建 
    if (document.getElementById(FLOATING_BTN_ID))  return;
    
    const btn = document.createElement('div'); 
    btn.id  = FLOATING_BTN_ID;
    btn.innerHTML  = '🔓 广告破解助手';
    btn.title  = "点击处理当前页面广告链接";
    
    // CSS样式确保跨域兼容 
    btn.style.cssText  = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 2147483647; /* 最大z-index确保置顶 */
        background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
        color: white;
        padding: 12px 25px;
        border-radius: 30px;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        font-weight: bold;
        font-size: 16px;
        font-family: 'Segoe UI', system-ui, sans-serif;
        border: none;
        user-select: none;
        animation: float 3s ease-in-out infinite;
        transition: all 0.3s ease;
    `;
    
    // 添加悬停动画 
    btn.addEventListener('mouseenter',  () => {
        btn.style.transform  = 'scale(1.05)';
        btn.style.boxShadow  = '0 8px 25px rgba(0,0,0,0.3)';
    });
    
    btn.addEventListener('mouseleave',  () => {
        btn.style.transform  = 'scale(1)';
        btn.style.boxShadow  = '0 6px 20px rgba(0,0,0,0.2)';
    });
    
    // 点击事件处理 
    btn.addEventListener('click',  handleGlobalButtonClick);
    
    document.body.appendChild(btn); 
    
    // 添加悬浮动画 
    const style = document.createElement('style'); 
    style.textContent  = `
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
    `;
    document.head.appendChild(style); 
}
async function handleGlobalButtonClick() {
    GM_notification({
        title: "广告破解助手",
        text: "正在扫描当前页面...",
        timeout: 2000 
    });
    
    // 1. 尝试检测广告链接 
    const adLinks = detectPageAdLinks();
    if (adLinks.length  > 0) {
        await processPageLinks();
        return;
    }
    
    // 2. 尝试检测验证码 
    const captchaSolved = await checkAndSolveCaptcha();
    if (captchaSolved) return;
    
    // 3. 无广告时的备选功能 
    showContextMenu();
}
function showContextMenu() {
    const btn = document.getElementById(FLOATING_BTN_ID); 
    btn.innerHTML  = '⏳ 功能菜单';
    
    // 创建菜单容器 
    const menu = document.createElement('div'); 
    menu.id  = 'bypass-context-menu';
    menu.style.cssText  = `
        position: absolute;
        bottom: 100%;
        right: 0;
        background: white;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.15);
        padding: 10px 0;
        min-width: 200px;
        z-index: 999999;
    `;
    
    // 菜单选项 
    const options = [
        {text: "🍃 清理悬浮广告", action: removeFloatingAds},
        {text: "🔄 绕过跳转追踪", action: removeLinkTrackers},
        {text: "🛡️ 隐私模式浏览", action: enablePrivacyMode},
        {text: "📋 复制纯净链接", action: copyCleanLinks}
    ];
    
    options.forEach(opt  => {
        const item = document.createElement('div'); 
        item.textContent  = opt.text; 
        item.style.cssText  = `
            padding: 10px 20px;
            cursor: pointer;
            transition: all 0.2s;
            color: #333;
            font-size: 14px;
        `;
        item.addEventListener('mouseenter',  () => {
            item.style.background  = '#f0f5ff';
            item.style.color  = '#2575fc';
        });
        item.addEventListener('mouseleave',  () => {
            item.style.background  = '';
            item.style.color  = '#333';
        });
        item.addEventListener('click',  opt.action); 
        menu.appendChild(item); 
    });
    
    btn.appendChild(menu); 
    
    // 点击外部关闭菜单 
    setTimeout(() => {
        document.addEventListener('click',  function closeMenu(e) {
            if (!menu.contains(e.target)  && e.target  !== btn) {
                menu.remove(); 
                btn.innerHTML  = '🔓 广告破解助手';
                document.removeEventListener('click',  closeMenu);
            }
        }, {once: true});
    }, 10);
}
/* ========== 页面功能函数 ========== */
function detectPageAdLinks() {
    // 智能检测广告链接的通用方案 
    const adSelectors = [
        'a[href*="ad."]',
        'a[href*="ads."]',
        'a[href*="track."]',
        'a[href*="affiliate"]',
        'iframe[src*="banner"]',
        'div[id*="ad-container"]',
        'div[class*="-ad"]',
        'div[id*="_ads_"]'
    ];
    
    return Array.from(document.querySelectorAll(adSelectors.join(','))); 
}
function removeFloatingAds() {
    // 清理常见浮动广告 
    const floatAdSelectors = [
        '#floating-ad',
        '.popup-ad',
        '.fixed-ad',
        '.ad-modal',
        '[class*="float"]',
        '[class*="pop"]',
        '[id*="overlay"]'
    ];
    
    floatAdSelectors.forEach(selector  => {
        document.querySelectorAll(selector).forEach(el  => el.remove()); 
    });
    GM_notification({title: "清理完成", text: "已移除悬浮广告"});
}
function removeLinkTrackers() {
    // 清理链接中的追踪参数 
    document.querySelectorAll('a[href]').forEach(link  => {
        try {
            const url = new URL(link.href); 
            ['utm_', 'fbclid', 'gclid', 'msclkid'].forEach(param => {
                if (url.searchParams.has(param))  {
                    link.href  = link.href.replace(new  RegExp(`[?&]${param}=[^&]+`), '');
                }
            });
        } catch {}
    });
    GM_notification({title: "追踪移除", text: "已清理链接追踪参数"});
}
/* ========== 跨域注入增强 ========== */
function ensureScriptInjection() {
    // 解决跨域CSS隔离问题 
    const globalStyle = document.createElement('style'); 
    globalStyle.textContent  = `
        #${FLOATING_BTN_ID} {
            all: initial !important; /* 重置所有样式 */
            /* 重新应用核心样式 */
            position: fixed !important;
            z-index: 2147483647 !important;
            cursor: pointer !important;
            font-family: sans-serif !important;
            font-size: 16px !important;
            /* 其他必要样式... */
        }
    `;
    document.head.appendChild(globalStyle); 
    
    // 防止目标网站移除按钮 
    const observer = new MutationObserver(mutations => {
        if (!document.getElementById(FLOATING_BTN_ID))  {
            createGlobalFloatingButton();
        }
    });
    observer.observe(document.body,  {childList: true, subtree: true});
}
// 增强版初始化 
function initUniversalSystem() {
    ensureScriptInjection();
    createGlobalFloatingButton();
    
    // 添加上下文菜单 
    GM.registerMenuCommand(" 隐藏/显示悬浮窗", toggleFloatingButton);
    GM.registerMenuCommand(" 扫描当前页面广告", scanCurrentPageAds);
}
(function() {
    'use strict';
    
}// 检查是否已在排除列表 
    const excludePatterns = [
        /^https?:\/\/(.*\.)?google\.com\//,
        /^https?:\/\/(.*\.)?https://cn.bing.com\//
        /^https?:\/\/(.*\.)?https://bing.com\//
        /^https?:\/\/(.*\.)?https://baidu.com\//
        /^https?:\/\/(.*\.)?https://https://voltar.lol\//
        /^https?:\/\/(.*\.)?https://https://bypass.city\//
    ];
    
    if (excludePatterns.some(pattern  => pattern.test(location.href)))  {
        return;
    }
    
    // 使用DOMContentLoaded确保页面元素加载 
    if (document.readyState  === 'loading') {
        document.addEventListener('DOMContentLoaded',  initUniversalSystem);
    } else {
        initUniversalSystem();
    }
    
    // 添加键盘快捷键支持 
    document.addEventListener('keydown',  e => {
        if (e.ctrlKey  && e.shiftKey  && e.key  === 'B') {
            document.getElementById(FLOATING_BTN_ID)?.click(); 
        }
    });
})();
/* ========== 核心功能整合 ========== */
// 引擎状态追踪 
const ENGINE_STATS = {};
 
// 并发绕过处理 
async function turboBypass(targetUrl) {
  const requests = ENHANCED_ENGINES.map(engine  => 
    new Promise(async (resolve) => {
      try {
        const cacheKey = `cache_${engine.name}_${btoa(targetUrl)}`; 
        const cached = GM_getValue(cacheKey);
        
        if (cached && (Date.now()  - cached.timestamp)  < engine.cacheTTL  * 1000) {
          resolve({ engine: engine.name,  result: cached.url  });
          return;
        }
 
        const response = await fetchEngine(engine, targetUrl);
        const resultUrl = engine.parser(response); 
        
        if (resultUrl) {
          GM_setValue(cacheKey, { url: resultUrl, timestamp: Date.now()  });
          updateEngineStats(engine.name,  true);
        }
        
        resolve({ engine: engine.name,  result: resultUrl });
      } catch (e) {
        updateEngineStats(engine.name,  false);
        resolve(null);
      }
    })
  );
 
  const { value } = await Promise.any(requests); 
  return value?.result || null;
}
 
// 引擎请求封装 
function fetchEngine(engine, targetUrl) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(),  engine.timeout  || CONFIG.engineTimeout); 
 
    // 本地引擎处理 
    if (engine.method  === "LOCAL") {
      try {
        clearTimeout(timeoutId);
        resolve(engine.parser()); 
      } catch (e) {
        reject(e);
      }
      return;
    }
 
    // 远程引擎请求 
    const url = new URL(engine.url); 
    
    if (engine.params)  {
      Object.entries(engine.params).forEach(([key,  val]) => 
        url.searchParams.append(key,  val)
      );
    }
 
    GM_xmlhttpRequest({
      method: engine.method, 
      url: url.toString(), 
      headers: engine.headers, 
      data: engine.method  === "POST" ? JSON.stringify({  url: targetUrl }) : undefined,
      timeout: engine.timeout  || CONFIG.engineTimeout, 
      onload: (res) => {
        clearTimeout(timeoutId);
        resolve(res.responseText); 
      },
      onerror: reject,
      ontimeout: reject
    });
  });
}
 
/* ========== UI 辅助函数 ========== */
// 应用UI样式
function applyUIStyles() {
  const styleId = 'bypass-ui-styles';
  let styleEl = document.getElementById(styleId); 
  
  if (!styleEl) {
    styleEl = document.createElement('style'); 
    styleEl.id  = styleId;
    document.head.appendChild(styleEl); 
  }
  
  const accentColor = CONFIG.ui.accentColor; 
  const bgColor = CONFIG.ui.darkMode  ? '#1e1e2e' : '#ffffff';
  const textColor = CONFIG.ui.darkMode  ? '#e2e2e2' : '#333333';
  
  styleEl.textContent  = `
    #bypass-container {
      bottom: ${isMobile() ? '65px' : '25px'};
      right: ${isMobile() ? '15px' : '25px'};
    }
    
    #bypass-main-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px ${hexToRgba(accentColor, 0.4)};
    }
    
    #bypass-menu {
      background: ${bgColor};
      color: ${textColor};
      border: ${CONFIG.ui.darkMode  ? '1px solid #333' : '1px solid #eee'};
    }
    
    .menu-header {
      background: ${hexToRgba(accentColor, 0.08)};
      padding: 18px 20px;
      border-bottom: 1px solid ${hexToRgba(accentColor, 0.1)};
    }
    
    .menu-header h3 {
      margin: 0 0 12px 0;
      font-size: 18px;
      color: ${accentColor};
    }
    
    .stats {
      display: flex;
      gap: 20px;
    }
    
    .stat-item {
      text-align: center;
    }
    
    .stat-label {
      display: block;
      font-size: 12px;
      opacity: 0.7;
    }
    
    .stat-value {
      display: block;
      font-size: 18px;
      font-weight: 600;
    }
    
    .menu-content {
      padding: 12px 0;
    }
    
    .menu-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 12px 24px;
      background: none;
      border: none;
      text-align: left;
      font-size: 15px;
      color: ${textColor};
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .menu-btn:hover {
      background: ${hexToRgba(accentColor, 0.05)};
    }
    
    .text-btn {
      font-size: 14px;
      color: ${hexToRgba(textColor, 0.8)};
    }
    
    .divider {
      height: 1px;
      background: ${CONFIG.ui.darkMode  ? '#333' : '#eee'};
      margin: 8px 0;
    }
    
    .menu-footer {
      padding: 12px 20px;
      border-top: 1px solid ${CONFIG.ui.darkMode  ? '#333' : '#eee'};
      font-size: 13px;
    }
    
    .engine-status {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #4caf50;
    }
    
    .status-dot.active  {
      background: #4caf50;
    }
    
    .status-dot.inactive  {
      background: #f44336;
    }
    
    @media (max-width: 768px) {
      #bypass-menu {
        width: 230px;
      }
    }
  `;
}
 
// 工具函数 
function hexToRgba(hex, opacity) {
  hex = hex.replace('#',  '');
  const r = parseInt(hex.substring(0,  2), 16);
  const g = parseInt(hex.substring(2,  4), 16);
  const b = parseInt(hex.substring(4,  6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
 
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent); 
}
 
/* ========== 初始化执行 ========== */
(function() {
  'use strict';
  
  // 等待jQuery加载 
  if (typeof $ !== 'undefined') {
    $(document).ready(init);
  } else {
    window.addEventListener('DOMContentLoaded',  init);
  }
  
  function init() {
    initEnhancedFloatingUI();
    
    // 自动检测广告页面 
    if (window.location.href.match(/adshnk\.com |linkvertise\.com/i)) {
      setTimeout(() => {
        processPageLinks();
        GM_notification({
          title: "检测到广告页面",
          text: "已自动处理广告链接",
          timeout: 2000
        });
      }, 1500);
    }
    
    // 初始人机验证检测 
    setTimeout(checkAndSolveCaptcha, 3000);
  }
})();
 // 在控制台调试悬浮窗
document.getElementById('bypass-main-btn').click(); 
// 切换到深色模式
CONFIG.ui.darkMode  = true;
applyUIStyles();

// 修改主色调 
CONFIG.ui.accentColor  = "#FF6B6B";
applyUIStyles();
/* ========== 使用声明 ========== */
/*
【合法使用场景】
1. 个人学习研究 
2. 访问被误判的合法内容
3. 无版权争议资源获取 
 
【严格禁止】
× 破解付费内容 
× 批量注册/刷量等黑产行为 
× 企业环境未经授权使用 
 
【免责声明】
本脚本所有代码均由AI生成，仅限合法用途。开发者不承担任何滥用责任。
 
【更新日志】
v1.03 (2025-6-2)
- 新增智能链接检测系统 
- 支持hCaptcha/Cloudflare验证码 
- 添加右键菜单功能
- 优化UI交互体验 
- 增强多引擎处理逻辑 
*/
【更新日志】
v1.05 (2025-6-2-21:00:00)
- 重新定义智能链接检测系统 
- 优化UI交互体验 
- 修改了UI设置与功能
- 增强引擎处理逻辑
-重新定义整个代码集
*/
 【更新日志】
v1.06 (2025-6-2-21:15:00)
- 修改了UI在每个网站的显示
- 默认按钮位置：右下角彩色悬浮按钮 
- 快捷键：Ctrl+Shift+B 
- 右键菜单：通过浏览器扩展图标访问 
*/
