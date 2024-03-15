import { io } from "/node_modules/socket.io-client/dist/socket.io.esm.min.js";

const el = (id) => document.getElementById(id);
const setContent = (elem, content) => (elem.innerText = content);
const addListener = (element, event, handler) =>
  element.addEventListener(event, handler);
const removeListener = (element, event, handler) =>
  element.removeEventListener(event, handler);

const socket = io();

const currentTempStatus = el("s_currentTemp");
const targetTempStatus = el("s_targetTemp");
const hvacStatus = el("s_hvacStatus");
const currentMode = el("currentMode");

const tmpSetBtn = el("setTarget");
const autoBtn = el("auto");
const coolBtn = el("cool");
const fanBtn = el("fan");
const heatBtn = el("heat");
const heatStage1Btn = el("heatStage1");
const heatStage2Btn = el("heatStage2");

const setTarget = () => {
  const val = Number(el("target").value);
  socket.emit("set:target", val);
};

const setMode = (mode) => () => {
  socket.emit("set:mode", mode);
};

addListener(tmpSetBtn, "click", setTarget);
addListener(autoBtn, "click", setMode(0));
addListener(fanBtn, "click", setMode(1));
addListener(coolBtn, "click", setMode(2));
addListener(heatBtn, "click", setMode(3));
addListener(heatStage1Btn, "click", setMode(4));
addListener(heatStage2Btn, "click", setMode(5));

const onError = (err) => {
  console.error(err);
};

const onTargetChange = (newTarget) => {
  setContent(targetTempStatus, newTarget);
};

const onTempChange = (newTemp) => {
  setContent(currentTempStatus, newTemp);
};

const onHvacChange = (hvacState) => {
  setContent(hvacStatus, hvacState);
};

const onModeChange = (newMode) => {
  setContent(currentMode, newMode);
};

socket.on("error", onError);
socket.on("target:change", onTargetChange);
socket.on("temp:change", onTempChange);
socket.on("hvac:change", onHvacChange);
socket.on("mode:change", onModeChange);
