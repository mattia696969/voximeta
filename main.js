/* ============================================================
   VOXIMETA — Shared behavior across all pages
   ============================================================ */
(function(){
  "use strict";

  var root = document.documentElement;
  root.classList.add("vx-booted");

  /* ---------------------------------------------------------
     Page veil: the frosted layer (html::before) melts away on
     arrival and frosts over again before leaving for another
     internal page.
  --------------------------------------------------------- */
  function veilOff(){ requestAnimationFrame(function(){ root.classList.add("vx-ready"); }); }
  window.addEventListener("pageshow", function(e){ if(e.persisted) root.classList.add("vx-ready"); });
  document.addEventListener("click", function(e){
    var a = e.target.closest && e.target.closest("a");
    if(!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if(a.target === "_blank" || a.hasAttribute("download")) return;
    var href = a.getAttribute("href");
    if(!href || href.charAt(0) === "#" || /^(mailto|tel):/i.test(href)) return;
    var url = new URL(a.href, location.href);
    if(url.origin !== location.origin) return;
    if(url.pathname === location.pathname && url.hash) return;
    e.preventDefault();
    root.classList.remove("vx-ready");
    setTimeout(function(){ location.href = a.href; }, 300);
  });

  /* ---------------------------------------------------------
     Hero headline: split into words that rise out of a blur
     one after another (styles: .hero-title .w).
  --------------------------------------------------------- */
  (function(){
    var title = document.querySelector(".hero-title");
    if(!title) return;
    var d = 0;
    title.setAttribute("aria-label", title.textContent.replace(/\s+/g, " ").trim());
    title.querySelectorAll(".hero-line").forEach(function(line){
      line.setAttribute("aria-hidden", "true");
      Array.prototype.slice.call(line.childNodes).forEach(function(node){
        if(node.nodeType === 3){
          var frag = document.createDocumentFragment();
          node.textContent.split(/(\s+)/).forEach(function(part){
            if(!part) return;
            if(/^\s+$/.test(part)){ frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement("span");
            w.className = "w";
            w.style.setProperty("--d", d++);
            w.textContent = part;
            frag.appendChild(w);
          });
          line.replaceChild(frag, node);
        } else if(node.nodeType === 1){
          node.classList.add("w");
          node.style.setProperty("--d", d++);
        }
      });
    });
  })();

  /* ---------------------------------------------------------
     Intro (once per session): the logo animation plays; when the
     logo settles the overlay blurs away and the logo glides up
     into the centre of the nav.
     The video is drawn onto a canvas with its white keyed out to
     transparency, so no "video white" rectangle can ever show
     against the page (phones colour-manage video differently).
  --------------------------------------------------------- */
  (function(){
    if(!root.classList.contains("vx-intro-pending")){ veilOff(); return; }

    /* Where the logo sits inside assetts/intro/logo-intro.mp4 once
       it has settled, as fractions of the frame. */
    var LOGO = {x:.14605, y:.30625, w:.70921, h:.39792};
    var overlay = document.createElement("div");
    overlay.className = "vx-intro";
    overlay.innerHTML =
      '<div class="vx-intro-stage">' +
        '<video class="vx-intro-video" src="assetts/intro/logo-intro.mp4" muted playsinline autoplay preload="auto"></video>' +
        '<canvas class="vx-intro-canvas" aria-hidden="true"></canvas>' +
      '</div>';
    document.body.appendChild(overlay);
    veilOff();

    var stage = overlay.querySelector(".vx-intro-stage");
    var video = overlay.querySelector("video");
    var canvas = overlay.querySelector("canvas");
    var ctx = null;
    try{ ctx = canvas.getContext("2d", {willReadFrequently:true}); }catch(e){}
    var done = false;
    var keyed = false;

    /* Un-composite each frame from white: alpha = 1 - min(r,g,b)/255,
       colour rescaled so it reads identically on any light page. */
    function drawFrame(){
      if(done || !ctx) return;
      if(video.readyState >= 2){
        var w = canvas.width, h = canvas.height;
        try{
          ctx.drawImage(video, 0, 0, w, h);
          var img = ctx.getImageData(0, 0, w, h), d = img.data;
          for(var i = 0; i < d.length; i += 4){
            var r = d[i], g = d[i+1], b = d[i+2];
            var m = r < g ? (r < b ? r : b) : (g < b ? g : b);
            var a = 255 - m;
            if(a < 6){ d[i+3] = 0; continue; }
            var k = 255 / a;
            d[i] = (r - m) * k; d[i+1] = (g - m) * k; d[i+2] = (b - m) * k;
            d[i+3] = a;
          }
          ctx.putImageData(img, 0, 0);
          if(!keyed){ keyed = true; overlay.classList.add("keyed"); }
        }catch(e){ ctx = null; return; }
      }
      requestAnimationFrame(drawFrame);
    }
    function sizeCanvas(){
      var r = stage.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(2, Math.min(1280, Math.round(r.width * dpr)));
      canvas.height = Math.round(canvas.width * 404 / 1280);
    }
    sizeCanvas();
    requestAnimationFrame(drawFrame);

    function finish(){
      if(done) return;
      done = true;
      try{ sessionStorage.setItem("vx_intro", "1"); }catch(e){}

      var vr = stage.getBoundingClientRect();
      var from = {left: vr.left + LOGO.x * vr.width, top: vr.top + LOGO.y * vr.height, width: LOGO.w * vr.width, height: LOGO.h * vr.height};
      var mark = document.querySelector(".nav-wordmark");
      var navLogo = mark && mark.querySelector("img");

      var clone = document.createElement("img");
      clone.src = "immagini/logo-voximeta.png";
      clone.alt = "";
      clone.className = "vx-intro-logo";
      clone.style.left = from.left + "px";
      clone.style.top = from.top + "px";
      clone.style.width = from.width + "px";
      clone.style.height = from.height + "px";
      document.body.appendChild(clone);
      if(mark) mark.classList.add("vx-hold");

      root.classList.remove("vx-intro-pending");
      overlay.classList.add("out");

      function cleanup(){
        if(mark) mark.classList.remove("vx-hold");
        clone.remove();
        overlay.remove();
      }

      requestAnimationFrame(function(){
        var to = navLogo ? navLogo.getBoundingClientRect() : null;
        if(!to || !to.width || !clone.animate){
          clone.style.transition = "opacity .6s, filter .6s";
          clone.style.opacity = "0";
          clone.style.filter = "blur(10px)";
          setTimeout(cleanup, 700);
          return;
        }
        var dx = to.left - from.left, dy = to.top - from.top, s = to.width / from.width;
        var anim = clone.animate([
          {transform:"translate(0,0) scale(1)", filter:"blur(0px)"},
          {offset:.45, filter:"blur(6px)"},
          {transform:"translate(" + dx + "px," + dy + "px) scale(" + s + ")", filter:"blur(0px)"}
        ], {duration:1050, easing:"cubic-bezier(.65,0,.15,1)", fill:"forwards"});
        anim.onfinish = cleanup;
      });
    }

    video.addEventListener("ended", finish);
    video.addEventListener("error", finish);
    overlay.addEventListener("click", finish);
    var p = video.play();
    if(p && p.catch) p.catch(function(){ setTimeout(finish, 400); });
    setTimeout(finish, 7000);
  })();

  /* ---------------------------------------------------------
     Eyes cursor (desktop only): over a video tile the pointer
     becomes a pair of eyes whose pupils follow the movement and
     drift a little when idle.
  --------------------------------------------------------- */
  (function(){
    if(!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    var SEL = ".vx-tile";
    var eyes = document.createElement("div");
    eyes.className = "vx-eyes";
    eyes.setAttribute("aria-hidden", "true");
    eyes.innerHTML =
      '<svg viewBox="0 0 64 48" width="58" height="44">' +
        '<defs><radialGradient id="vxEyeWhite" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset=".75" stop-color="#f3f3f3"/><stop offset="1" stop-color="#d9d9d9"/></radialGradient></defs>' +
        '<ellipse cx="18" cy="24" rx="12.5" ry="19.5" fill="url(#vxEyeWhite)" stroke="#2a2a2a" stroke-width="1.4"/>' +
        '<ellipse cx="46" cy="24" rx="12.5" ry="19.5" fill="url(#vxEyeWhite)" stroke="#2a2a2a" stroke-width="1.4"/>' +
        '<g class="vx-pupil"><circle cx="18" cy="26" r="6.6" fill="#7a4310"/><circle cx="18" cy="26" r="3.4" fill="#140b04"/><circle cx="20.2" cy="23.6" r="1.5" fill="#fff"/></g>' +
        '<g class="vx-pupil"><circle cx="46" cy="26" r="6.6" fill="#7a4310"/><circle cx="46" cy="26" r="3.4" fill="#140b04"/><circle cx="48.2" cy="23.6" r="1.5" fill="#fff"/></g>' +
      '</svg>';
    document.addEventListener("DOMContentLoaded", function(){ document.body.appendChild(eyes); });
    var pupils = eyes.getElementsByClassName("vx-pupil");

    var x = 0, y = 0, lx = 0, ly = 0, vx = 0, vy = 0, px = 0, py = 0, on = false, raf = 0, t0 = 0;
    function loop(ts){
      if(!t0) t0 = ts;
      vx += ((x - lx) - vx) * .25; vy += ((y - ly) - vy) * .25;
      lx = x; ly = y;
      var idle = (ts - t0) / 1000;
      var tx = Math.max(-4, Math.min(4, vx * .6)) + Math.sin(idle * 1.3) * 1.2;
      var ty = Math.max(-6, Math.min(6, vy * .6)) + Math.cos(idle * 1.7) * 1.4;
      px += (tx - px) * .2; py += (ty - py) * .2;
      for(var i = 0; i < pupils.length; i++) pupils[i].setAttribute("transform", "translate(" + px.toFixed(2) + " " + py.toFixed(2) + ")");
      eyes.style.transform = "translate3d(" + x + "px," + y + "px,0) translate(-50%,-50%) rotate(" + (Math.sin(idle * 2) * 3).toFixed(2) + "deg)";
      raf = on ? requestAnimationFrame(loop) : 0;
    }
    document.addEventListener("pointermove", function(e){
      x = e.clientX; y = e.clientY;
      var over = !!(e.target.closest && e.target.closest(SEL));
      if(over !== on){
        on = over;
        eyes.classList.toggle("on", on);
        root.classList.toggle("vx-eyes-on", on);
        if(on && !raf){ lx = x; ly = y; t0 = 0; raf = requestAnimationFrame(loop); }
      }
    }, {passive:true});
    document.addEventListener("pointerleave", function(){ on = false; eyes.classList.remove("on"); root.classList.remove("vx-eyes-on"); });
    /* Re-check what is under the pointer when the page changes under
       it without the mouse moving (a click opens the lightbox, a scroll). */
    function recheck(){
      setTimeout(function(){
        var el = document.elementFromPoint(x, y);
        var over = !!(el && el.closest && el.closest(SEL));
        if(over !== on){
          on = over;
          eyes.classList.toggle("on", on);
          root.classList.toggle("vx-eyes-on", on);
          if(on && !raf){ lx = x; ly = y; t0 = 0; raf = requestAnimationFrame(loop); }
        }
      }, 0);
    }
    document.addEventListener("click", recheck, true);
    window.addEventListener("scroll", recheck, {passive:true, capture:true});
  })();

  /* ---------------------------------------------------------
     Web3Forms — each form carries its own access_key value
     directly in its HTML (Brand Audit and Waitlist use separate
     keys), so nothing here overrides them.
  --------------------------------------------------------- */

  /* ---------- Footer year (if present) ---------- */
  document.addEventListener("DOMContentLoaded", function(){
    var y = document.getElementById("year");
    if(y) y.textContent = new Date().getFullYear();
  });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if(revealEls.length){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, {threshold:0.15, rootMargin:"0px 0px -60px 0px"});
    revealEls.forEach(function(el){ io.observe(el); });
  }

  /* ---------- Letter-by-letter typewriter (section headings) ---------- */
  function splitLetters(el){
    var text = el.textContent;
    el.setAttribute("aria-label", text);
    el.innerHTML = "";
    el.classList.add("letters");
    text.split("").forEach(function(ch, i){
      var span = document.createElement("span");
      span.textContent = ch === " " ? " " : ch;
      span.style.transitionDelay = (i * 26) + "ms";
      span.setAttribute("aria-hidden", "true");
      span.className = "letter";
      el.appendChild(span);
    });
  }
  var typewriterEls = document.querySelectorAll("[data-typewriter]");
  if(typewriterEls.length){
    typewriterEls.forEach(splitLetters);
    var twIo = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add("is-typing");
          twIo.unobserve(entry.target);
        }
      });
    }, {threshold:0.4});
    typewriterEls.forEach(function(el){ twIo.observe(el); });
  }

  /* ---------- Underline "marker" sweep ---------- */
  var sweepEls = document.querySelectorAll(".underline-sweep");
  if(sweepEls.length){
    var swIo = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          var el = entry.target;
          setTimeout(function(){ el.classList.add("is-swept"); }, 350);
          swIo.unobserve(el);
        }
      });
    }, {threshold:0.6});
    sweepEls.forEach(function(el){ swIo.observe(el); });
  }

  /* ---------- Real viewport height for #hero (mobile browsers resize
     their chrome, so 100dvh alone isn't always reliable in practice —
     this reads the actual window height directly). ---------- */
  (function(){
    function setHeroVh(){
      document.documentElement.style.setProperty("--vh100", window.innerHeight + "px");
    }
    setHeroVh();
    window.addEventListener("resize", setHeroVh);
    window.addEventListener("orientationchange", setHeroVh);
  })();

  /* ---------- Nav pill compacts on scroll ---------- */
  document.addEventListener("DOMContentLoaded", function(){
    var pill = document.getElementById("navPill");
    if(!pill) return;
    function onScroll(){ pill.classList.toggle("scrolled", window.scrollY > 40); }
    onScroll();
    document.addEventListener("scroll", onScroll, {passive:true});
  });

  /* ---------- Mobile nav burger ---------- */
  document.addEventListener("DOMContentLoaded", function(){
    var burger = document.getElementById("navBurger");
    var mobileMenu = document.getElementById("mobileMenu");

    /* Current page gets the filled dot in the mobile menu. */
    function pageKey(path){
      var last = (path.split("/").pop() || "index").replace(/\.html$/, "");
      return last || "index";
    }
    if(mobileMenu){
      var here = pageKey(location.pathname);
      mobileMenu.querySelectorAll("a[href]").forEach(function(a){
        var href = a.getAttribute("href");
        if(href && href !== "#" && pageKey(href) === here) a.setAttribute("aria-current", "page");
      });
    }
    if(burger && mobileMenu){
      burger.addEventListener("click", function(){
        var isOpen = mobileMenu.classList.toggle("open");
        burger.classList.toggle("open", isOpen);
        burger.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
      mobileMenu.querySelectorAll("a").forEach(function(a){
        a.addEventListener("click", function(){
          mobileMenu.classList.remove("open");
          burger.classList.remove("open");
          burger.setAttribute("aria-expanded", "false");
        });
      });
    }

    /* ---------- "Entra in waitlist" deny animation + toast ---------- */
    var waitlistToastTimer = null;
    function showWaitlistToast(){
      var toast = document.getElementById("waitlistToast");
      if(!toast){
        toast = document.createElement("div");
        toast.id = "waitlistToast";
        toast.className = "toast";
        toast.textContent = "Per entrare in waitlist devi richiedere un Brand Audit";
        document.body.appendChild(toast);
      }
      toast.classList.add("show");
      clearTimeout(waitlistToastTimer);
      waitlistToastTimer = setTimeout(function(){ toast.classList.remove("show"); }, 3200);
    }
    document.querySelectorAll(".js-waitlist-link").forEach(function(link){
      link.addEventListener("click", function(e){
        e.preventDefault();
        showWaitlistToast();
        if(link.classList.contains("denied")) return;
        link.classList.add("denied");
        setTimeout(function(){ link.classList.remove("denied"); }, 900);
      });
    });

    /* ---------- Smooth scroll for in-page anchors ---------- */
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(function(link){
      link.addEventListener("click", function(e){
        var target = document.querySelector(link.getAttribute("href"));
        if(target){
          e.preventDefault();
          target.scrollIntoView({behavior:"smooth", block:"start"});
        }
      });
    });

    /* ---------------------------------------------------------
       Cookie consent banner (injected from here, so it is the same
       on every page). The choice is stored in localStorage under
       "voximeta_cookie_consent" ("accepted" / "rejected") and a
       "voximeta:cookieconsent" event is fired on `document`.
       The Meta Pixel is loaded ONLY after "accepted" (right after the
       click and on later visits). Closing the banner with the X
       counts as "rejected". The footer "Preferenze cookie" link
       reopens the banner.
    --------------------------------------------------------- */
    var CONSENT_KEY = "voximeta_cookie_consent";
    var META_PIXEL_ID = "1786846272506287";

    function loadMetaPixel(){
      if(window.fbq) return;
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', META_PIXEL_ID);
      fbq('track', 'PageView');
    }

    var cookieBanner = document.createElement("div");
    cookieBanner.className = "cookie-banner";
    cookieBanner.id = "cookieBanner";
    cookieBanner.setAttribute("role", "dialog");
    cookieBanner.setAttribute("aria-label", "Preferenze cookie");
    cookieBanner.innerHTML =
      '<button type="button" class="cookie-close" id="cookieClose" aria-label="Chiudi (equivale a rifiutare)">&times;</button>' +
      '<p>Usiamo cookie tecnici necessari al funzionamento del sito e, se acconsenti, cookie di marketing (Meta Pixel) per misurare le campagne. ' +
      'Puoi cambiare idea in qualsiasi momento da “Preferenze cookie” in fondo alla pagina. ' +
      '<a href="privacy.html">Cookie e privacy</a></p>' +
      '<div class="cookie-banner-actions">' +
        '<button type="button" class="cookie-btn" id="cookieReject">Rifiuta</button>' +
        '<button type="button" class="cookie-btn" id="cookieAccept">Accetta</button>' +
      '</div>';
    document.body.appendChild(cookieBanner);

    function showBanner(){ requestAnimationFrame(function(){ cookieBanner.classList.add("show"); }); }

    function setConsent(value){
      try{ localStorage.setItem(CONSENT_KEY, value); }catch(e){}
      cookieBanner.classList.remove("show");
      if(value === "accepted"){
        loadMetaPixel();
      } else if(typeof window.fbq === "function"){
        window.fbq("consent", "revoke");
      }
      document.dispatchEvent(new CustomEvent("voximeta:cookieconsent", {detail: value}));
    }

    var existing = null;
    try{ existing = localStorage.getItem(CONSENT_KEY); }catch(e){}
    if(existing === "accepted"){
      loadMetaPixel();
      document.dispatchEvent(new CustomEvent("voximeta:cookieconsent", {detail: existing}));
    } else if(existing === "rejected"){
      document.dispatchEvent(new CustomEvent("voximeta:cookieconsent", {detail: existing}));
    } else {
      showBanner();
    }

    document.getElementById("cookieAccept").addEventListener("click", function(){ setConsent("accepted"); });
    document.getElementById("cookieReject").addEventListener("click", function(){ setConsent("rejected"); });
    document.getElementById("cookieClose").addEventListener("click", function(){ setConsent("rejected"); });

    var footerInner = document.querySelector(".footer-inner-new");
    if(footerInner){
      var prefs = document.createElement("a");
      prefs.href = "#";
      prefs.className = "footer-prefs";
      prefs.textContent = "Preferenze cookie";
      prefs.addEventListener("click", function(e){ e.preventDefault(); showBanner(); });
      footerInner.appendChild(prefs);
    }
  });

  /* ---------------------------------------------------------
     Lightweight anti-spam heuristics (client-side, best-effort).
  --------------------------------------------------------- */
  var SPAM_BLOCKLIST = ["asdf","asdasd","test test","xxxx","aaaa","qwerty","boh","n/a","na na","spam","prova prova","1234","lorem ipsum","qwerty123"];

  function looksLikeGibberish(text){
    var t = (text || "").trim().toLowerCase();
    if(t.length < 3) return true;
    for(var i=0;i<SPAM_BLOCKLIST.length;i++){
      if(t.indexOf(SPAM_BLOCKLIST[i]) !== -1) return true;
    }
    if(/(.)\1{4,}/.test(t)) return true;
    var letters = (t.match(/[a-zàèéìòù]/g) || []).length;
    var vowels = (t.match(/[aeiouàèéìòù]/g) || []).length;
    if(letters > 6 && (vowels / letters) < 0.15) return true;
    return false;
  }

  window.VoxValidators = {
    fullName: function(v){ return /^[A-Za-zÀ-ÿ'’-]{2,}(\s+[A-Za-zÀ-ÿ'’-]{2,}){1,}$/.test((v||"").trim()); },
    email: function(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((v||"").trim()); },
    phone: function(v){ return (v||"").replace(/\D/g,"").length >= 8; },
    social: function(v){ return (v||"").trim().length >= 2 && !looksLikeGibberish(v); },
    notEmpty: function(v){ return (v||"").trim().length > 0; },
    shortText: function(v){ return (v||"").trim().length >= 6 && !looksLikeGibberish(v); },
    longText: function(v){
      var t = (v||"").trim();
      return t.length >= 15 && t.split(/\s+/).length >= 4 && !looksLikeGibberish(v);
    }
  };

  /* ---------------------------------------------------------
     Generic Web3Forms submit (single-page forms, e.g. waitlist).
  --------------------------------------------------------- */
  window.attachSmartForm = function(formEl, fieldRules){
    if(!formEl) return;
    var errorEl = formEl.querySelector(".form-error");
    var successEl = formEl.parentElement.querySelector(".form-success");
    var submitBtn = formEl.querySelector(".submit-btn");

    formEl.addEventListener("submit", function(e){
      e.preventDefault();
      if(errorEl) errorEl.textContent = "";

      var honeypot = formEl.querySelector(".hp-field");
      if(honeypot && honeypot.checked){
        formEl.style.display = "none";
        if(successEl) successEl.style.display = "block";
        return;
      }

      for(var name in fieldRules){
        var field = formEl.querySelector('[name="' + name + '"]');
        if(field && !fieldRules[name](field.value)){
          var label = field.dataset.label || name;
          if(errorEl) errorEl.textContent = 'Controlla il campo "' + label + '": la risposta non sembra completa o pertinente.';
          field.focus();
          return;
        }
      }

      if(submitBtn){ submitBtn.disabled = true; submitBtn.textContent = "Invio in corso..."; }

      var payload = {};
      new FormData(formEl).forEach(function(value, key){ payload[key] = value; });

      window.submitLead(payload)
        .then(function(ok){
          if(ok){
            formEl.style.display = "none";
            if(successEl) successEl.style.display = "block";
          } else {
            if(errorEl) errorEl.textContent = "Errore di invio, riprova o scrivici a voximeta@gmail.com.";
            if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = "Invia richiesta"; }
          }
        });
    });
  };

  /* ---------------------------------------------------------
     Shared Google Sheets POST helper — returns a Promise<boolean>.
     GOOGLE_SHEETS_URL is the "Web app" URL you get after deploying
     the Apps Script (google-apps-script.gs) attached to the Sheet.
     Content-Type is text/plain on purpose: Apps Script web apps do
     not answer CORS preflight (OPTIONS) requests, so the request
     must stay a CORS "simple request" (no preflight) or it always
     fails with a generic network error before it even reaches Google.
  --------------------------------------------------------- */
  var GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbxHP-8Zk82t-exZ5N80vqK3Bx3ShHHdkoKSp2_vBGvKKkf67QePmGCytmqClDg_LKC9/exec";
  window.submitLead = function(payload){
    return fetch(GOOGLE_SHEETS_URL, {
      method: "POST",
      headers: {"Content-Type":"text/plain;charset=utf-8"},
      body: JSON.stringify(payload)
    })
    .then(function(res){ return res.json(); })
    .then(function(data){ return !!data.success; })
    .catch(function(){ return false; });
  };

})();
