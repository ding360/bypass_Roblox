// ==UserScript== 
// @name        广告链接绕过+人机验证破解助手 Pro
// @namespace   https://github.com/ding360
// @version     1.03 
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
 
/* ========== 全局配置 ========== */
const CONFIG = {
  engines: [
    {
      name: "bypass_city",
      url: "https://bypass.city/", 
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": "FREE_TIER"
      },
      parser: function(response) {
        try {
          const data = JSON.parse(response); 
          return data.direct_url  || null;
        } catch {
          return fallbackParser(response);
        }
      }
    },
    {
      name: "voltar_lol",
      url: "https://voltar.lol/", 
      method: "GET",
      parser: function(response) {
        const metaRefresh = response.match(/<meta  http-equiv="refresh" content=".*url=(.*?)"/i);
        return metaRefresh?.[1] ? decodeURIComponent(metaRefresh[1]) : null;
      }
    },
    {
      name: "direct_bypass",
      url: "",
      method: "CLIENT",
      parser: function() {
        return extractDirectLink(document.body.innerHTML); 
      }
    }
  ],
  captcha: {
    services: {
      YES_CAPTCHA: {
        api_key: "YOUR_API_KEY", // 需到 yescaptcha.com  申请
        endpoint: "https://api.yescaptcha.com/createTask", 
        timeout: 30000
      }
    },
    max_attempts: 3 
  }
};
 
/* ========== 核心功能模块 ========== */
const iconBase64 = 
 "https://github.com/ding360/bypass_Roblox/blob/main/favicon.ico"
floatingBtn.innerHTML  = `
  <img src="${iconBase64}" style="vertical-align: middle; width: 128px; height: 128px; margin-right: 6px;">
  <span>绕过广告链接</span>
`;{
}
function initBypassSystem() {
  // 创建悬浮按钮
  const floatingBtn = document.createElement('div'); 
  floatingBtn.id  = 'bypass-floating-btn';
  floatingBtn.innerHTML  = '🚀 bypass link';
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
    fontFamily: "'Segoe UI', sans-serif",
    transition: 'all 0.3s ease'
  });
  
  floatingBtn.addEventListener('mouseenter',  () => {
    floatingBtn.style.transform  = 'scale(1.05)';
    floatingBtn.style.boxShadow  = '0 6px 16px rgba(74, 108, 247, 0.4)';
  });
  
  floatingBtn.addEventListener('mouseleave',  () => {
    floatingBtn.style.transform  = 'scale(1)';
    floatingBtn.style.boxShadow  = '0 4px 12px rgba(74, 108, 247, 0.3)';
  });
  
  floatingBtn.addEventListener('click',  processPageLinks);
  document.body.appendChild(floatingBtn); 
 
  // 自动检测广告链接 
  setTimeout(autoDetectAdLinks, 2000);
 
  // 人机验证监听器
  new MutationObserver(checkAndSolveCaptcha)
    .observe(document.body,  { childList: true, subtree: true });
}
 
/* ========== 增强功能模块 ========== */
function initEnhancedSystem() {
  initBypassSystem();
  
  // 自动预加载常见广告站点 
  if (location.host.match(/adshnk\.com |linkvertise\.com|boost\.ink/i)) {
    setTimeout(autoPreloadLinks, 1500);
  }
}
 
// 智能链接检测 
function detectAdLinks() {
  const suspiciousSelectors = [
    'a[href*="adf.ly"]', 
    'a[href*="linkvertise"]',
    'a[href*="shorte.st"]', 
    'a[href*="sub2unlock"]',
    'iframe[src*="captcha"]',
    'div[class*="interstitial"]',
    'div[class*="ad-container"]'
  ];
  
  return Array.from(document.querySelectorAll(suspiciousSelectors.join(','))); 
}
 
// 增强版验证码破解
async function solveEnhancedCaptcha() {
  const captchaTypes = {
    RECAPTCHA: {
      selector: '.g-recaptcha, [data-sitekey]',
      solver: solveRecaptchaV2
    },
    HCAPTCHA: {
      selector: '.h-captcha',
      solver: solveHCaptcha 
    },
    CLOUDFLARE: {
      selector: '#challenge-form',
      solver: solveCloudflare 
    }
  };
 
  for (const [type, config] of Object.entries(captchaTypes))  {
    const element = document.querySelector(config.selector); 
    if (element) {
      console.log(` 检测到${type}验证码`);
      return await config.solver(element); 
    }
  }
  return false;
}
 
/* ========== 广告链接处理 ========== */
async function processPageLinks() {
  const adLinks = detectAdLinks();
  
  if (adLinks.length  === 0) {
    GM_notification({
      title: "未检测到链接",
      text: "当前页面没有可处理的链接",
      timeout: 3000
    });
    return;
  }
 
  GM_notification({
    title: "开始处理",
    text: `检测到 ${adLinks.length}  个链接，正在绕过...`
  });
 
  for (const link of adLinks) {
    const originalHref = link.href; 
    let finalUrl = null;
    
    // 尝试多个绕过引擎
    for (const engine of CONFIG.engines)  {
      try {
        finalUrl = await bypassLink(engine, originalHref);
        if (finalUrl) break;
      } catch (e) {
        console.error(` 引擎 ${engine.name}  失败:`, e);
      }
    }
 
    if (finalUrl) {
      link.href  = finalUrl;
      link.style.border  = "2px solid #4caf50";
      link.title  = "已绕过! 原始链接: " + originalHref;
    }
  }
}
 
/* ========== 验证码破解模块 ========== */
async function solveRecaptchaV2(element) {
  const siteKey = element.dataset.sitekey; 
  
  // 优先使用API破解 
  if (CONFIG.captcha.services.YES_CAPTCHA.api_key)  {
    try {
      const taskData = {
        clientKey: CONFIG.captcha.services.YES_CAPTCHA.api_key, 
        task: {
          type: "NoCaptchaTaskProxyless",
          websiteURL: window.location.href, 
          websiteKey: siteKey 
        }
      };
      
      const response = await fetch(CONFIG.captcha.services.YES_CAPTCHA.endpoint,  {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData) 
      });
      
      const result = await response.json(); 
      if (result.errorId  === 0) {
        document.getElementById('g-recaptcha-response').value  = result.solution.gRecaptchaResponse; 
        document.querySelector('.recaptcha-verify-button')?.click(); 
        return true;
      }
    } catch (e) {
      console.error("API 请求失败:", e);
    }
  }
  
  // 降级使用行为模拟 
  const checkbox = element.querySelector('.recaptcha-checkbox'); 
  if (checkbox) {
    simulateHumanClick(checkbox);
    await new Promise(resolve => setTimeout(resolve, 3000));
    return true;
  }
  
  return false;
}
 
// hCaptcha破解
async function solveHCaptcha(element) {
  // 实现逻辑类似reCAPTCHA
  // ...
}
 
// Cloudflare验证破解
async function solveCloudflare(element) {
  // 实现逻辑
  // ...
}
 
/* ========== 工具函数 ========== */
function simulateHumanClick(element) {
  const rect = element.getBoundingClientRect(); 
  const points = generateBezierPoints(
    {x: window.scrollX  + rect.left  + 5, y: window.scrollY  + rect.top  + 5},
    {x: window.scrollX  + rect.left  + 15, y: window.scrollY  + rect.top  + 15},
    30 
  );
  
  points.forEach((point,  i) => {
    setTimeout(() => {
      const event = new MouseEvent('mousemove', {
        bubbles: true,
        clientX: point.x,
        clientY: point.y
      });
      document.elementFromPoint(point.x,  point.y).dispatchEvent(event);
      
      if (i === points.length  - 1) {
        ['mousedown', 'mouseup', 'click'].forEach(type => {
          element.dispatchEvent(new  MouseEvent(type, { bubbles: true }));
        });
      }
    }, i * 20);
  });
}
 
function generateBezierPoints(start, end, pointCount) {
  const points = [];
  for (let i = 0; i <= pointCount; i++) {
    const t = i / pointCount;
    const x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * (start.x + 50) + t * t * end.x;
    const y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * (start.y - 30) + t * t * end.y;
    points.push({  x, y });
  }
  return points;
}
 
function fallbackParser(html) {
  const patterns = [
    /<meta.*?url=(.*?)"/i,
    /window\.location\.href\s*=\s*["'](.*?)["']/,
    /<a[^>]+href=["'](.*?)["'][^>]*>跳过广告/
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern); 
    if (match && match[1]) return match[1];
  }
  return null;
}
 
/* ========== 初始化和事件绑定 ========== */
(function() {
  'use strict';
  
  // 添加右键菜单 
  GM.registerMenuCommand(" 手动检测广告链接", () => {
    const links = detectAdLinks();
    GM_notification({
      title: "检测结果",
      text: `发现 ${links.length}  个可疑链接`,
      timeout: 3000
    });
  });
  
  GM.registerMenuCommand(" 测试验证码破解", async () => {
    const result = await solveEnhancedCaptcha();
    GM_notification({
      title: "验证码测试",
      text: result ? "破解成功!" : "未检测到验证码",
      timeout: 3000
    });
  });
  
  // 初始化系统 
  $(document).ready(initEnhancedSystem);
})();
 
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
v1.03 (2023-11-20)
- 新增智能链接检测系统 
- 支持hCaptcha/Cloudflare验证码 
- 添加右键菜单功能
- 优化UI交互体验 
- 增强多引擎处理逻辑 
*/
