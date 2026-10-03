/**
 * PAA Landing Page - Interactive Simulator Script
 */

document.addEventListener("DOMContentLoaded", () => {
  const pet = document.getElementById("mockupPet");
  const petAnchor = document.getElementById("mockupPetAnchor");
  const orbitMenu = document.getElementById("orbitMenu");
  const stateButtons = document.querySelectorAll(".state-btn");
  const tipBadge = document.querySelector(".pet-click-tip");

  let isWalking = true;
  let facingLeft = false;
  let posX = 180;
  let menuOpen = false;
  let screenWidth = 880;

  // Toggle Orbit Menu on click
  petAnchor.addEventListener("click", (e) => {
    e.stopPropagation();
    menuOpen = !menuOpen;
    orbitMenu.style.display = menuOpen ? "block" : "none";
    if (tipBadge) tipBadge.style.display = "none";
  });

  // Close menu if clicked outside
  document.addEventListener("click", () => {
    if (menuOpen) {
      menuOpen = false;
      orbitMenu.style.display = "none";
    }
  });

  // State Switcher buttons in demo
  stateButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      stateButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const state = btn.dataset.state;
      updatePetState(state);
    });
  });

  function updatePetState(state) {
    const accessoryLaptop = document.getElementById("pixelLaptop");
    const accessoryBulb = document.getElementById("pixelBulb");
    const accessoryStars = document.getElementById("pixelStars");

    if (accessoryLaptop) accessoryLaptop.style.display = state === "coding" ? "block" : "none";
    if (accessoryBulb) accessoryBulb.style.display = state === "thinking" ? "block" : "none";
    if (accessoryStars) accessoryStars.style.display = state === "success" ? "block" : "none";

    const bubble = document.getElementById("demoSpeechBubble");
    if (bubble) {
      if (state === "idle") {
        bubble.style.display = "none";
      } else {
        bubble.style.display = "block";
        const text = document.getElementById("demoBubbleText");
        if (text) {
          if (state === "thinking") text.innerText = "Analyzing project files...";
          if (state === "coding") text.innerText = "Refactoring database connector...";
          if (state === "success") text.innerText = "Task completed successfully! ✨";
        }
      }
    }
  }

  // Autonomous Roaming along the Mockup Taskbar
  setInterval(() => {
    if (menuOpen) return;

    // Check bounds
    if (posX > 720) {
      facingLeft = true;
    } else if (posX < 80) {
      facingLeft = false;
    } else if (Math.random() < 0.15) {
      facingLeft = !facingLeft;
    }

    const step = (facingLeft ? -1 : 1) * 35;
    posX = Math.max(60, Math.min(740, posX + step));

    petAnchor.style.left = `${posX}px`;
    pet.style.transform = facingLeft ? "scaleX(-1)" : "scaleX(1)";
  }, 1800);

  // FAQ Accordion
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    item.addEventListener("click", () => {
      const answer = item.querySelector(".faq-answer");
      const icon = item.querySelector(".faq-icon");
      const isVisible = answer.style.display === "block";

      faqItems.forEach((other) => {
        other.querySelector(".faq-answer").style.display = "none";
        other.querySelector(".faq-icon").innerText = "+";
      });

      if (!isVisible) {
        answer.style.display = "block";
        icon.innerText = "−";
      }
    });
  });
});
