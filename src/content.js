let preferredTimeZone = 'LOCAL';
let tooltip = null;
let lastTarget = null;
let lastMatchText = null;

chrome.storage.sync.get({ preferredTimeZone }, (result) => {
  if (result.preferredTimeZone) {
    preferredTimeZone = result.preferredTimeZone;
  }
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.preferredTimeZone && changes.preferredTimeZone.newValue) {
    preferredTimeZone = changes.preferredTimeZone.newValue;
  }
});

function createTooltip() {
  if (tooltip) return tooltip;
  tooltip = document.createElement('div');
  tooltip.setAttribute('id', 'timezone-hover-converter-tooltip');
  tooltip.style.position = 'fixed';
  tooltip.style.zIndex = '2147483647';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.background = 'rgba(32, 33, 36, 0.95)';
  tooltip.style.color = '#fff';
  tooltip.style.border = '1px solid rgba(255,255,255,0.18)';
  tooltip.style.borderRadius = '6px';
  tooltip.style.padding = '8px 10px';
  tooltip.style.fontSize = '13px';
  tooltip.style.boxShadow = '0 4px 18px rgba(0,0,0,0.3)';
  tooltip.style.transition = 'opacity 0.15s ease';
  tooltip.style.opacity = '0';
  tooltip.style.maxWidth = '260px';
  tooltip.style.wordBreak = 'break-word';
  document.body.appendChild(tooltip);
  return tooltip;
}

function showTooltip(text, x, y) {
  const node = createTooltip();
  node.textContent = text;
  node.style.left = `${Math.min(x + 12, window.innerWidth - 280)}px`;
  node.style.top = `${Math.min(y + 12, window.innerHeight - 46)}px`;
  node.style.opacity = '1';
}

function hideTooltip() {
  if (tooltip) {
    tooltip.style.opacity = '0';
  }
}

function findDateStringInText(text) {
  if (!text) return null;
  const normalized = cleanupText(text);
  const match = normalized.match(DATE_PATTERN);
  return match ? match[0] : null;
}

function handleHover(event) {
  const target = event.target;
  if (!target || target === lastTarget) return;
  lastTarget = target;

  const text = target.innerText || target.textContent;
  const candidate = findDateStringInText(text);
  if (!candidate || candidate === lastMatchText) return;
  lastMatchText = candidate;
  const parsed = parseDateTimeString(candidate);
  if (!parsed) return;

  const converted = formatForTimeZone(parsed, preferredTimeZone);
  if (!converted) return;
  showTooltip(`${candidate} → ${converted}`, event.clientX, event.clientY);
}

function handleMouseOut() {
  lastTarget = null;
  lastMatchText = null;
  hideTooltip();
}

document.addEventListener('mousemove', handleHover, { passive: true });
document.addEventListener('mouseout', handleMouseOut, { passive: true });
