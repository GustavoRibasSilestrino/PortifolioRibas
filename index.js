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

    if ("IntersectionObserver" in window) {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                /* Already scrolled past (deep link, restored scroll position):
                   show it right away, it will never intersect again. */
                var passed = entry.boundingClientRect.bottom < 0;
                if (entry.isIntersecting || passed) {
                    entry.target.setAttribute("data-visible", "");
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });

        revealItems.forEach(function (item) { revealObserver.observe(item); });
    } else {
        revealItems.forEach(function (item) { item.setAttribute("data-visible", ""); });
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

    /* Footer year. */
    var year = document.querySelector("[data-year]");
    if (year) {
        year.textContent = String(new Date().getFullYear());
    }
})();
