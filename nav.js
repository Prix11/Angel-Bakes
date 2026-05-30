(function initSiteNav() {
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  if (!navToggle || !nav) return;

  let backdrop = document.querySelector(".nav-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.className = "nav-backdrop";
    backdrop.hidden = true;
    backdrop.setAttribute("aria-hidden", "true");
    document.body.appendChild(backdrop);
  }

  function setOpen(open) {
    nav.classList.toggle("is-open", open);
    navToggle.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    backdrop.classList.toggle("is-open", open);
    backdrop.hidden = !open;
    document.body.classList.toggle("nav-open", open);
  }

  navToggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(!nav.classList.contains("is-open"));
  });

  backdrop.addEventListener("click", () => setOpen(false));

  nav.querySelectorAll("a, button").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (el.tagName !== "A") {
        setOpen(false);
        return;
      }

      const href = el.getAttribute("href") || "";
      const hashIndex = href.indexOf("#");

      if (hashIndex !== -1) {
        const hash = href.slice(hashIndex + 1);
        const pathPart = href.slice(0, hashIndex);
        const targetPath = new URL(pathPart || ".", window.location.origin).pathname
          .replace(/\/$/, "") || "/";
        const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
        const onSamePage =
          targetPath === currentPath ||
          (targetPath === "/" &&
            (currentPath === "" || currentPath === "/index.html"));

        if (hash && onSamePage) {
          e.preventDefault();
          setOpen(false);
          window.setTimeout(() => {
            const section = document.getElementById(hash);
            if (section) {
              section.scrollIntoView({ behavior: "smooth", block: "start" });
              history.pushState(null, "", `#${hash}`);
            }
          }, 150);
          return;
        }
      }

      setOpen(false);
    });
  });
})();

(function initLogoTransition() {
  const logo = document.querySelector(".logo");
  if (!logo) return;

  function isHomePath(pathname) {
    const p = pathname.replace(/\/$/, "") || "/";
    return p === "" || p === "/" || p === "/index.html";
  }

  document.body.classList.add("page-enter");
  requestAnimationFrame(() => {
    document.body.classList.add("page-enter-active");
  });

  logo.addEventListener("click", (e) => {
    const href = logo.getAttribute("href") || "/";
    const currentPath = window.location.pathname;
    const target = new URL(href, window.location.origin);

    if (!isHomePath(target.pathname)) return;

    if (isHomePath(currentPath)) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    e.preventDefault();
    document.body.classList.remove("page-enter", "page-enter-active");
    document.body.classList.add("page-leaving");

    window.setTimeout(() => {
      window.location.href = target.pathname + target.hash;
    }, 320);
  });
})();
