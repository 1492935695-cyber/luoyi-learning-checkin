importScripts('island-logic.js?v=20260914b');
self.onmessage = function(event) {
  const { level, state, request } = event.data;
  const l = IslandLogic.levels[level];
  if (!l || !IslandLogic.valid(l, state)) return;
  const result = IslandLogic.solve(l, state, 180000);
  self.postMessage({ request, ...result });
};
