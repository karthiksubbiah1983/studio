
// This is a singleton.
let applied = false;

export function applyPolyfill() {
  if (applied) {
    return;
  }
  
  require('drag-drop-touch');
  applied = true;
}
