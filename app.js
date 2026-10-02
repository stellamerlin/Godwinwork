const REQUESTS_KEY = "godwin-painting-requests";
let selectedPaintColor = null;

function readRequests() {
  try {
    const saved = localStorage.getItem(REQUESTS_KEY);
    if (!saved) return [];
    const requests = JSON.parse(saved);
    return Array.isArray(requests) ? requests : [];
  } catch (error) {
    console.error("Could not read painting requests from localStorage.", error);
    return [];
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("visible"), 3000);
}

function renderRequests() {
  const requests = readRequests();
  const list = document.getElementById("requests-list");
  list.replaceChildren();
  document.getElementById("request-count").textContent = `${requests.length} ${requests.length === 1 ? "request" : "requests"}`;
  document.getElementById("requests-empty").hidden = requests.length > 0;
  requests.forEach((request) => {
    const card = document.createElement("article");
    card.className = "request-card";
    const summary = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = `${request.service} · ${request.name}`;
    const details = document.createElement("p");
    details.textContent = `${request.size} · ${request.location} · ${request.phone}${request.color ? ` · Paint color: ${request.color.name} (${request.color.hex})` : ""}${request.details ? ` · ${request.details}` : ""}`;
    const time = document.createElement("time");
    time.dateTime = request.createdAt;
    time.textContent = new Date(request.createdAt).toLocaleDateString();
    summary.append(name, details);
    card.append(summary, time);
    list.append(card);
  });
}

function selectPaintColor(name, hex) {
  selectedPaintColor = { name, hex };
  document.querySelectorAll(".paint-swatch, .hero-color-choice").forEach((button) => {
    button.classList.toggle("selected", button.dataset.color === name && button.dataset.hex === hex);
  });
  document.getElementById("selected-color-name").textContent = name;
  document.getElementById("selected-color-hex").textContent = hex;
  document.getElementById("form-color-name").textContent = `${name} (${hex})`;
  document.getElementById("selected-paint-color").value = `${name} (${hex})`;
  document.getElementById("color-preview").style.setProperty("--preview-color", hex);
  document.querySelectorAll(".house-wall").forEach((wall) => wall.style.setProperty("color", hex));
  document.getElementById("hero-color-selection").textContent = name;
}

document.querySelectorAll(".paint-swatch").forEach((button) => {
  button.addEventListener("click", () => selectPaintColor(button.dataset.color, button.dataset.hex));
});

document.querySelectorAll(".hero-color-choice").forEach((button) => {
  button.addEventListener("click", () => selectPaintColor(button.dataset.color, button.dataset.hex));
});

document.getElementById("custom-color").addEventListener("input", (event) => {
  document.getElementById("custom-color-value").textContent = event.currentTarget.value.toUpperCase();
});

document.getElementById("use-custom-color").addEventListener("click", () => {
  const hex = document.getElementById("custom-color").value.toUpperCase();
  selectPaintColor(`Custom ${hex}`, hex);
});

document.getElementById("clear-color").addEventListener("click", () => {
  selectedPaintColor = null;
  document.querySelectorAll(".paint-swatch, .hero-color-choice").forEach((button) => button.classList.remove("selected"));
  document.getElementById("selected-color-name").textContent = "Choose a color";
  document.getElementById("selected-color-hex").textContent = "Pick a swatch or custom color";
  document.getElementById("form-color-name").textContent = "No color selected";
  document.getElementById("selected-paint-color").value = "";
  document.getElementById("color-preview").style.removeProperty("--preview-color");
  document.querySelectorAll(".house-wall").forEach((wall) => wall.style.removeProperty("color"));
  document.getElementById("hero-color-selection").textContent = "Pick a color";
});

function filterWork(category, scrollToGallery = false) {
  const cards = [...document.querySelectorAll(".work-card[data-work-category]")];
  const visibleCards = cards.filter((card) => category === "all" || card.dataset.workCategory === category);
  cards.forEach((card) => {
    card.hidden = category !== "all" && card.dataset.workCategory !== category;
  });
  document.querySelectorAll(".work-filter").forEach((button) => {
    const active = button.dataset.workFilter === category;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  const categoryName = category === "all" ? "Interior and exterior" : category[0].toUpperCase() + category.slice(1);
  document.getElementById("work-filter-status").textContent =
    category === "all" ? `${categoryName} inspiration` : `Showing ${visibleCards.length} ${categoryName.toLowerCase()} painting examples`;
  if (scrollToGallery) {
    document.getElementById("work").scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  }
}

document.querySelectorAll("[data-work-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    filterWork(button.dataset.workFilter, button.classList.contains("service-gallery-button"));
  });
});

document.getElementById("menu-toggle").addEventListener("click", (event) => {
  const nav = document.getElementById("main-nav");
  const open = nav.classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll(".main-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    document.getElementById("main-nav").classList.remove("open");
    document.getElementById("menu-toggle").setAttribute("aria-expanded", "false");
  });
});

function enableMotion() {
  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const revealTargets = document.querySelectorAll(
    ".intro-strip, .section-heading, .service-card, .palette-group, .custom-color-row, .color-preview, .work-card, .order-copy, .order-form, .requests-heading, .request-card",
  );
  revealTargets.forEach((element, index) => {
    element.classList.add("reveal-on-scroll");
    if (element.matches(".service-card, .palette-group, .work-card")) {
      element.style.setProperty("--reveal-delay", `${(index % 4) * 75}ms`);
    }
  });
  document.body.classList.add("motion-ready");
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting && entry.boundingClientRect.bottom > 0) return;
      entry.target.classList.add("is-visible");
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -35px 0px" });
  revealTargets.forEach((element) => observer.observe(element));
  let revealScheduled = false;
  const revealPassedSections = () => {
    revealScheduled = false;
    revealTargets.forEach((element) => {
      if (element.classList.contains("is-visible")) return;
      if (element.getBoundingClientRect().top >= window.innerHeight) return;
      element.classList.add("is-visible");
      observer.unobserve(element);
    });
  };
  const scheduleRevealCheck = () => {
    if (revealScheduled) return;
    revealScheduled = true;
    window.requestAnimationFrame(revealPassedSections);
  };
  window.addEventListener("scroll", scheduleRevealCheck, { passive: true });
  window.addEventListener("hashchange", scheduleRevealCheck);
  scheduleRevealCheck();

  const sections = document.querySelectorAll("main > section[id]");
  const navLinks = document.querySelectorAll(".main-nav a[href^='#']");
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => link.classList.toggle("active", link.hash === `#${entry.target.id}`));
    });
  }, { rootMargin: "-25% 0px -65% 0px" });
  sections.forEach((section) => navObserver.observe(section));
}

document.getElementById("order-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  const request = {
    id: globalThis.crypto?.randomUUID?.() || `request-${Date.now()}`,
    name: String(values.get("name")).trim(),
    phone: String(values.get("phone")).trim(),
    location: String(values.get("location")).trim(),
    service: String(values.get("service")),
    size: String(values.get("size")),
    color: selectedPaintColor,
    details: String(values.get("details")).trim(),
    createdAt: new Date().toISOString(),
  };
  const requests = readRequests();
  try {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify([request, ...requests]));
  } catch (error) {
    console.error("Could not save painting request.", error);
    document.getElementById("order-message").textContent = "Could not save your request. Please check your browser storage and try again.";
    return;
  }

  const message = [
    "Hello Godwin, I would like a painting estimate.",
    `Name: ${request.name}`,
    `Phone: ${request.phone}`,
    `Project location: ${request.location}`,
    `Service: ${request.service}`,
    `Project size: ${request.size}`,
    `Paint color: ${request.color ? `${request.color.name} (${request.color.hex})` : "Not selected"}`,
    `Project details: ${request.details || "Not provided"}`,
  ].join("\n");
  const whatsappUrl = `https://wa.me/919488088292?${new URLSearchParams({ text: message })}`;
  const whatsappWindow = window.open(whatsappUrl, "_blank");
  if (whatsappWindow) {
    whatsappWindow.opener = null;
  }

  event.currentTarget.reset();
  const orderMessage = document.getElementById("order-message");
  orderMessage.replaceChildren(document.createTextNode(
    "Request saved on this device. WhatsApp is ready with your details; press Send there to share it with Godwin. ",
  ));
  if (!whatsappWindow) {
    const whatsappLink = document.createElement("a");
    whatsappLink.href = whatsappUrl;
    whatsappLink.target = "_blank";
    whatsappLink.rel = "noopener noreferrer";
    whatsappLink.textContent = "Open WhatsApp";
    orderMessage.append(whatsappLink);
  }
  renderRequests();
  showToast("Request saved. Complete sending it in WhatsApp.");
});

renderRequests();
enableMotion();
