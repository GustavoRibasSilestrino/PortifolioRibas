/* Portfolio interactions: header state, mobile menu, scroll reveal, active link. */

(function () {
    "use strict";

    /* Only hide the reveal elements when this script is actually running. */
    document.documentElement.setAttribute("data-js", "");

    var header = document.querySelector("[data-header]");
    var nav = document.getElementById("nav");
    var toggle = document.querySelector("[data-nav-toggle]");
    var navLinks = nav ? Array.prototype.slice.call(nav.querySelectorAll("a")) : [];
    var sections = navLinks
        .map(function (link) { return document.querySelector(link.getAttribute("href")); })
        .filter(Boolean);

    /* Header background once the page scrolls. */
    function onScroll() {
        if (window.scrollY > 20) {
            header.setAttribute("data-scrolled", "");
        } else {
            header.removeAttribute("data-scrolled");
        }
    }

    if (header) {
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
    }

    /* Mobile menu. */
    function closeMenu() {
        nav.removeAttribute("data-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
    }

    if (toggle && nav) {
        toggle.addEventListener("click", function () {
            var open = nav.hasAttribute("data-open");
            if (open) {
                closeMenu();
            } else {
                nav.setAttribute("data-open", "");
                toggle.setAttribute("aria-expanded", "true");
                toggle.setAttribute("aria-label", "Close menu");
            }
        });

        navLinks.forEach(function (link) {
            link.addEventListener("click", closeMenu);
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && nav.hasAttribute("data-open")) {
                closeMenu();
                toggle.focus();
            }
        });
    }

    /* Reveal elements as they enter the viewport. Containers marked .stagger
       or .stagger-pop reveal their children one by one: each child gets an
       index in --i, which the CSS turns into an animation-delay. */
    var revealItems = Array.prototype.slice.call(
        document.querySelectorAll(".reveal, .stagger, .stagger-pop")
    );
    var staggerGroups = document.querySelectorAll(".stagger, .stagger-pop");

    Array.prototype.forEach.call(staggerGroups, function (group) {
        Array.prototype.forEach.call(group.children, function (child, index) {
            child.style.setProperty("--i", String(index));
        });
    });

    /* Above-the-fold content plays on load: waiting for the observer would
       leave the hero blank on the first paint. */
    revealItems = revealItems.filter(function (item) {
        if (item.getAttribute("data-reveal-on") !== "load") return true;
        item.setAttribute("data-visible", "");
        return false;
    });

    function show(item) {
        item.setAttribute("data-visible", "");
    }

    if ("IntersectionObserver" in window) {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                /* Already scrolled past (deep link, restored scroll position):
                   show it right away, it will never intersect again. */
                var passed = entry.boundingClientRect.bottom < 0;
                if (entry.isIntersecting || passed) {
                    show(entry.target);
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });

        revealItems.forEach(function (item) { revealObserver.observe(item); });

        /* A jump scroll (scrollbar drag, End key) can skip the threshold
           crossing entirely and leave a section stuck invisible. Sweep the
           leftovers once the scrolling settles; the list only shrinks. */
        var sweepTimer;
        window.addEventListener("scroll", function () {
            if (!revealItems.length) return;
            clearTimeout(sweepTimer);
            sweepTimer = setTimeout(function () {
                revealItems = revealItems.filter(function (item) {
                    if (!item.hasAttribute("data-visible")) {
                        if (item.getBoundingClientRect().bottom > 0) return true;
                        show(item);
                    }
                    revealObserver.unobserve(item);
                    return false;
                });
            }, 150);
        }, { passive: true });
    } else {
        revealItems.forEach(show);
    }

    /* Highlight the nav link of the section in view. */
    if (sections.length && "IntersectionObserver" in window) {
        var sectionObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                navLinks.forEach(function (link) {
                    if (link.getAttribute("href") === "#" + entry.target.id) {
                        link.setAttribute("data-active", "");
                    } else {
                        link.removeAttribute("data-active");
                    }
                });
            });
        }, { threshold: 0.35, rootMargin: "-20% 0px -50% 0px" });

        sections.forEach(function (section) { sectionObserver.observe(section); });
    }


    /* Cursor follower: a ring that trails the pointer and reacts to anything
       clickable. Mouse-like pointers only, and skipped when the user asked
       for reduced motion. The native cursor is never hidden, so this stays
       pure decoration. */
    var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    var calmMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (finePointer.matches && !calmMotion.matches) {
        var cursor = document.createElement("div");
        cursor.className = "cursor";
        cursor.setAttribute("aria-hidden", "true");
        cursor.appendChild(document.createElement("span"));
        document.body.appendChild(cursor);

        var pointerX = 0;
        var pointerY = 0;
        var ringX = 0;
        var ringY = 0;
        var ticking = false;

        function drawCursor() {
            ringX += (pointerX - ringX) * 0.18;
            ringY += (pointerY - ringY) * 0.18;
            cursor.style.transform = "translate3d(" + ringX + "px, " + ringY + "px, 0)";

            /* Stop the loop once it has caught up: no idle rAF burning battery. */
            if (Math.abs(pointerX - ringX) > 0.1 || Math.abs(pointerY - ringY) > 0.1) {
                requestAnimationFrame(drawCursor);
            } else {
                ticking = false;
            }
        }

        function isInteractive(node) {
            return node instanceof Element && node.closest("a, button, [role='button']");
        }

        document.addEventListener("pointermove", function (event) {
            if (event.pointerType && event.pointerType !== "mouse") return;

            pointerX = event.clientX;
            pointerY = event.clientY;

            /* First move: drop the ring straight onto the pointer instead of
               flying in from the top-left corner. */
            if (!cursor.hasAttribute("data-active")) {
                ringX = pointerX;
                ringY = pointerY;
                cursor.setAttribute("data-active", "");
            }

            if (!ticking) {
                ticking = true;
                requestAnimationFrame(drawCursor);
            }
        }, { passive: true });

        document.addEventListener("pointerover", function (event) {
            if (isInteractive(event.target)) cursor.setAttribute("data-hover", "");
        }, { passive: true });

        document.addEventListener("pointerout", function (event) {
            if (!isInteractive(event.relatedTarget)) cursor.removeAttribute("data-hover");
        }, { passive: true });

        document.addEventListener("pointerdown", function () {
            cursor.setAttribute("data-press", "");
        }, { passive: true });

        document.addEventListener("pointerup", function () {
            cursor.removeAttribute("data-press");
        }, { passive: true });

        /* Fade out when the pointer leaves the window. */
        document.documentElement.addEventListener("pointerleave", function () {
            cursor.removeAttribute("data-active");
            cursor.removeAttribute("data-hover");
        });
    }

    /* Footer year. */
    var year = document.querySelector("[data-year]");
    if (year) {
        year.textContent = String(new Date().getFullYear());
    }
})();
