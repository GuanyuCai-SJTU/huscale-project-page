"use strict";
// Task media revisions (content fingerprints).
const taskMediaRevs = {"task-1.mp4": "8acf8ed5d8fa", "task-2.mp4": "e80177207a0b", "task-3.mp4": "166d50543d3a", "task-4.mp4": "7cf62a06e8c4", "task-5.mp4": "052d8ea26156", "task-6.mp4": "20f631715b1a"};
const taskPosterRevs = {"task-1.webp": "fc793ba26057", "task-2.webp": "79e5871f2194", "task-3.webp": "f66b6f76c09a", "task-4.webp": "0a77c42c4824", "task-5.webp": "b406f839fd08", "task-6.webp": "270c60f7e1ae"};
const tasks = [
  ["Pick-and-Lift", "Walk to the table, grasp the bottle, and lift it clear of the support."],
  ["Pick-and-Place", "Grasp the bottle, carry it to the destination, and release it into the box."],
  ["Pedal Disposal", "Carry the bottle to the bin, press the pedal, and release it through the open lid."],
  ["Bedside Cabinet", "Bring the bottle to the bedside cabinet, place it in the drawer, and close the drawer."],
  ["Drawer Storage", "Use one hand to open the drawer and the other to insert the bottle."],
  ["Two-Object Transport", "Transport two bottles to their respective drop boxes in one episode."]
];

const tabs = Array.from(document.querySelectorAll("[data-task]"));
const panel = document.getElementById("task-panel");
const player = document.getElementById("task-player");
const demo = document.getElementById("demo-player");
demo.addEventListener("play", () => player.pause());
player.addEventListener("play", () => demo.pause());
for (const chapter of document.querySelectorAll("[data-demo-time]")) {
  chapter.addEventListener("click", () => {
    demo.currentTime = Number(chapter.dataset.demoTime);
    demo.play().catch(() => {});
    if (matchMedia("(max-width: 720px)").matches) demo.scrollIntoView({block:"center"});
  });
}
function activate(tab, focus = false) {
  const index = Number(tab.dataset.task);
  const [title, caption] = tasks[index - 1];
  for (const item of tabs) {
    item.setAttribute("aria-selected", String(item === tab));
    item.tabIndex = item === tab ? 0 : -1;
  }
  if (focus) tab.focus();
  panel.setAttribute("aria-labelledby", tab.id);
  player.pause();
  const poster = "task-" + index + ".webp";
  player.poster = "assets/media/" + poster + "?v=" + taskPosterRevs[poster];
  const clip = "task-" + index + ".mp4";
  player.src = "assets/media/" + clip + "?v=" + taskMediaRevs[clip];
  player.setAttribute("aria-label", title + " simulation rollout");
  document.getElementById("task-name").textContent = title;
  document.getElementById("task-description").textContent = caption;
}
for (const [i, tab] of tabs.entries()) {
  tab.addEventListener("click", () => activate(tab));
  tab.addEventListener("keydown", event => {
    let next;
    switch (event.key) {
      case "Home": next = 0; break;
      case "End": next = tabs.length - 1; break;
      case "ArrowDown": case "ArrowRight": next = (i + 1) % tabs.length; break;
      case "ArrowUp": case "ArrowLeft": next = (i + tabs.length - 1) % tabs.length; break;
      default: return;
    }
    event.preventDefault();
    activate(tabs[next], true);
  });
}

const dialog = document.getElementById("media-dialog");
const content = document.getElementById("dialog-content");
const close = document.getElementById("close-dialog");
let opener;
if (typeof dialog.showModal === "function") {
  for (const link of document.querySelectorAll(".media-trigger, .image-trigger")) {
    link.addEventListener("click", event => {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      player.pause();
      demo.pause();
      document.getElementById("dialog-title").textContent = link.dataset.title;
      document.getElementById("dialog-subtitle").textContent = link.dataset.subtitle || "";
      const isVideo = link.classList.contains("media-trigger");
      const media = document.createElement(isVideo ? "video" : "img");
      if (isVideo) {
        media.poster = link.dataset.poster || "";
        media.controls = true;
        media.playsInline = true;
        media.setAttribute("aria-label", link.dataset.title + " rollout");
      } else {
        media.alt = link.dataset.alt || link.dataset.title;
      }
      media.src = link.href;
      content.replaceChildren(media);
      dialog.showModal();
      if (isVideo) media.play().catch(() => {});
    });
  }
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", e => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    const clip = content.querySelector("video");
    if (clip) {
      clip.pause();
      clip.removeAttribute("src");
      clip.load();
    }
    content.replaceChildren();
    opener?.focus({preventScroll:true});
  });
}

const copy = document.getElementById("copy-citation");
const cite = document.getElementById("citation-code");
const status = document.getElementById("copy-status");
copy.addEventListener("click", async () => {
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(cite.textContent.trim());
    status.textContent = "BibTeX copied.";
  } catch {
    const range = document.createRange();
    range.selectNodeContents(cite);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    const ok = document.execCommand("copy");
    if (ok) selection.removeAllRanges();
    status.textContent = ok ? "BibTeX copied." : "BibTeX selected. Use your browser’s copy command.";
  }
});
