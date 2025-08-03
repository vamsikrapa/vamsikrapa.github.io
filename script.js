// === Theme Toggle === const toggle = document.getElementById('theme-toggle'); const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

// Load saved theme if (localStorage.getItem("theme") === "dark" || (!localStorage.getItem("theme") && prefersDarkScheme.matches)) { document.documentElement.setAttribute("data-theme", "dark"); } else { document.documentElement.setAttribute("data-theme", "light"); }

// Toggle theme toggle.addEventListener("click", () => { const currentTheme = document.documentElement.getAttribute("data-theme"); const newTheme = currentTheme === "dark" ? "light" : "dark"; document.documentElement.setAttribute("data-theme", newTheme); localStorage.setItem("theme", newTheme); });

// === Scroll Animations === const sections = document.querySelectorAll(".section"); const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add("visible"); } }); });

sections.forEach(section => { observer.observe(section); });

// === Back to Top Button === const backToTop = document.getElementById("back-to-top");

window.addEventListener("scroll", () => { if (window.scrollY > 300) { backToTop.style.display = "block"; } else { backToTop.style.display = "none"; } });

