/* ============================================================
   VOXIMETA — Shared behavior across all pages
   ============================================================ */
(function(){
  "use strict";

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
    var META_PIXEL_ID = "1003854249414332";

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
