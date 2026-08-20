/* ============================================================
   VOXIMETA — Shared behavior across all pages
   ============================================================ */
(function(){
  "use strict";

  /* ---------------------------------------------------------
     Web3Forms access key — https://web3forms.com
  --------------------------------------------------------- */
  var WEB3FORMS_ACCESS_KEY = "15c9c84f-3475-4771-97d2-59f3373a2db7";

  document.addEventListener("DOMContentLoaded", function(){
    document.querySelectorAll('input[name="access_key"]').forEach(function(input){
      input.value = WEB3FORMS_ACCESS_KEY;
    });
  });

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

    /* ---------- "Entra in waitlist" deny animation ---------- */
    document.querySelectorAll(".js-waitlist-link").forEach(function(link){
      link.addEventListener("click", function(e){
        e.preventDefault();
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

      window.submitToWeb3Forms(payload)
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
     Shared Web3Forms POST helper — returns a Promise<boolean>.
  --------------------------------------------------------- */
  window.submitToWeb3Forms = function(payload){
    return fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {"Content-Type":"application/json", "Accept":"application/json"},
      body: JSON.stringify(payload)
    })
    .then(function(res){ return res.json(); })
    .then(function(data){ return !!data.success; })
    .catch(function(){ return false; });
  };

  /* ---------------------------------------------------------
     Bunny Stream video gate — Bunny's own native player (play/
     pause/volume/fullscreen) stays fully visible and usable; a
     thin CSS-only strip (.video-seek-shield) over the seek bar
     is the only thing blocked, so the timeline can't be dragged.
     This just listens (via player.js) for duration/ended so it
     can drive a "time remaining" readout, a lock icon, and
     opts.onUnlock() — with a wall-clock fallback that takes over
     if the iframe never confirms real events.
  --------------------------------------------------------- */
  window.initBunnyVideoGate = function(opts){
    var iframe = document.getElementById(opts.iframeId);
    if(!iframe || typeof playerjs === "undefined") return null;
    var player = new playerjs.Player(iframe);
    var lastAllowedTime = 0;
    var duration = 0;
    var realEventsSeen = false;
    var everEnded = false;
    var fallbackRemaining = opts.fallbackDuration || 240;

    function formatTime(sec){
      sec = Math.max(0, Math.round(sec || 0));
      var m = Math.floor(sec / 60);
      var s = sec % 60;
      return m + ":" + (s < 10 ? "0" : "") + s;
    }

    function unlock(){
      if(everEnded) return;
      everEnded = true;
      clearInterval(fallbackInterval);
      if(opts.lockEl){ opts.lockEl.textContent = "🔓"; opts.lockEl.classList.add("unlocked"); }
      if(opts.timerEl) opts.timerEl.textContent = "Video completato";
      if(opts.onUnlock) opts.onUnlock();
    }

    /* Wall-clock fallback: takes over the timer/unlock if the
       iframe never confirms real playback events back to us
       (some embed/postMessage setups are unreliable), so the
       gate still works even without accurate video data. */
    var fallbackInterval = setInterval(function(){
      if(realEventsSeen){ clearInterval(fallbackInterval); return; }
      fallbackRemaining--;
      if(opts.timerEl) opts.timerEl.textContent = formatTime(fallbackRemaining) + " rimanenti";
      if(fallbackRemaining <= 0){
        clearInterval(fallbackInterval);
        unlock();
      }
    }, 1000);

    player.on("ready", function(){
      player.on("timeupdate", function(data){
        realEventsSeen = true;
        if(data.duration) duration = data.duration;
        if(data.seconds > lastAllowedTime + 1.2){
          player.setCurrentTime(lastAllowedTime);
        } else {
          lastAllowedTime = data.seconds;
        }
        if(opts.timerEl && lastAllowedTime < duration - 0.4){
          opts.timerEl.textContent = formatTime(duration - data.seconds) + " rimanenti";
        }
      });
      player.on("ended", function(){ realEventsSeen = true; unlock(); });
      if(opts.onReady) opts.onReady(player);
    });

    return player;
  };
})();
