class Ring extends HTMLElement {
	constructor() {
		super();
		const stroke = this.getAttribute('stroke');
		const radius = this.getAttribute('radius');
		const normalizedRadius = radius - stroke * 2;
		const outerRadius = normalizedRadius + stroke / 2;
		const innerRadius = normalizedRadius - stroke / 2;
		this._circumference = normalizedRadius * 2 * Math.PI;

		this._ringMode = this.getAttribute('ring-mode');

		let textFontSize = '6em';
		if (this._ringMode === 'countdown-timer') {
			textFontSize = '2em';
		}

		this._root = this.attachShadow({mode: 'open'});
		this._root.innerHTML = `
			<svg
				height="${radius * 2}"
				width="${radius * 2}"
			>
				<circle
					stroke="white"
					stroke-width=1px
					fill="transparent"
					r="${innerRadius}"
					cx="${radius}"
					cy="${radius}"
				/>
				<circle
					id="painted-ring"
					stroke="white"
					stroke-dasharray="${this._circumference} ${this._circumference}"
					style="stroke-dashoffset:${this._circumference}"
					stroke-width="${stroke}"
					fill="transparent"
					r="${normalizedRadius}"
					cx="${radius}"
					cy="${radius}"
				/>
				<circle
					stroke="white"
					stroke-width=1px
					fill="transparent"
					r="${outerRadius}"
					cx="${radius}"
					cy="${radius}"
				/>
				<text
					id="ring-counter"
					x="50%"
					y="50%"
					text-anchor="middle"
					fill="white"
					font-size="${textFontSize}"
					dy=".3em"
				/>
			</svg>

			<style>
				#painted-ring {
					transition: stroke-dashoffset 0.35s;
					transform: rotate(-90deg);
					transform-origin: 50% 50%;
        			}
			</style>
		`;
	}
  
	setProgress(percent) {
		const offset = this._circumference - (percent / 100 * this._circumference);
		const circle = this._root.getElementById('painted-ring');
		circle.style.strokeDashoffset = offset; 
	}

	setCounter(count) {
		if (this._ringMode !== 'counter') return;

		const text = this._root.getElementById('ring-counter');
		text.textContent = count;
	}

	setRemainingTime(remainingMs) {
		if (this._ringMode !== 'countdown-timer') return;

		const zfill = (num, len) => (Array(len).join("0") + num).slice(-len);

		let remainingSecs = Math.ceil(remainingMs / 1000);
		const hours = Math.floor(remainingSecs / (60 * 60));
		remainingSecs = remainingSecs - (hours * 60 * 60);
		const minutes = Math.floor(remainingSecs / 60);
		remainingSecs = remainingSecs - (minutes * 60);

		const text = this._root.getElementById('ring-counter');
		text.textContent = zfill(hours, 2) + ':' + zfill(minutes, 2) + ':' + zfill(remainingSecs, 2);
	}

	static get observedAttributes() {
		return ['progress', 'counter', 'remaining-time'];
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'progress') {
			this.setProgress(newValue);
		} else if (name === 'counter') {
			this.setCounter(newValue);
		} else if (name === 'remaining-time') {
			this.setRemainingTime(newValue);
		}
	}
}

window.customElements.define('sensory-ring', Ring);

const inputMode = 'buttons';

initInput();
initInputButtons();
initRing();
reset();

function getStartButton() {
	return document.getElementById('start-button');
}

function getPauseButton() {
	return document.getElementById('pause-button');
}

function getResetButton() {
	return document.getElementById('reset-button');
}

function reset() {
	hideRing();
	hideError();
	if (inputMode === 'buttons') {
		showInputButtons();
	} else {
		clearInput();
		showInput();
		focusInput();
	}
}

function showError(msg) {
	document.getElementById("error").innerHTML = msg;
	document.getElementById("error").style.display = "block";
}

function hideError() {
	const el = document.getElementById('error');
	document.getElementById("error").style.display = "none";
}

function initInput() {
	const startEl = getStartButton();
	startEl.addEventListener('click', checkInput);
}

function showInput() {
	document.getElementById("input-container").style.display = "block";
}

function checkInput() {
	const duration = document.getElementsByName("duration")[0].value;
	if (!duration) {
		showError("Please enter a duration");
		clearInput();
		focusInput();
		return;
	}

	if (duration < 0) {
		showError("Please enter a positive duration");
		clearInput();
		focusInput();
		return;
	}

	hideError();
	hideInput();
	launchRing(duration * 60 * 1000);
}

function clearInput() {
	document.getElementsByName("duration")[0].value = "";
}

function hideInput() {
	document.getElementById("input-container").style.display = "none";
}

function focusInput() {
	document.getElementsByName("duration")[0].focus();
}

function initInputButtons() {
	document.getElementById('5min-button').addEventListener('click', checkInputButtons);
	document.getElementById('10min-button').addEventListener('click', checkInputButtons);
	document.getElementById('15min-button').addEventListener('click', checkInputButtons);
	document.getElementById('30min-button').addEventListener('click', checkInputButtons);
}

function showInputButtons() {
	document.getElementById("input-button-container").style.display = "block";
}

function checkInputButtons(e) {
	hideInputButtons();
	launchRing(e.target.getAttribute('ring-duration') * 60 * 1000);
}

function hideInputButtons() {
	document.getElementById("input-button-container").style.display = "none";
}

function initRing() {
	const pauseEl = getPauseButton();
	pauseEl.addEventListener('click', togglePauseRing);

	const resetEl = getResetButton();
	resetEl.addEventListener('click', reset);
}

function showRing() {
	document.getElementById('ring-container').style.display = "block";
}

var timer;

function hideRing() {
	if (timer) {
		clearInterval(timer);
	}

	document.getElementById('ring-container').style.display = "none";
}

let isRingPaused = false;
let pausedAtMs = 0;
let pausedTimeMs = 0;

function launchRing(lapTimeMs) {
	isRingPaused = false;
	pausedAtMs = 0;
	pausedTimeMs = 0;
	handlePauseResume();

	let lapCounter = 0;
	const el = document.querySelector('sensory-ring');
	el.setAttribute('counter', lapCounter);
	el.setAttribute('remaining-time', lapTimeMs);
	el.setAttribute('progress', 0);

	// Time at which lap counter is reset to 0.
	const resetDurationMs = 1 * 60 * 60 * 1000;	// 1 hour in ms

	const timerIntervalMs = 50;
	let startTimeMs = Date.now();

	timer = setInterval(() => {
		if (isRingPaused) return;

		const now = Date.now();

		const elapsedTimeMs = now - startTimeMs - pausedTimeMs;

		const resetCounterNow = Math.floor(elapsedTimeMs / resetDurationMs);
		const resetCounterPrev = Math.floor((elapsedTimeMs - timerIntervalMs > 0 ? elapsedTimeMs - timerIntervalMs : 0) / resetDurationMs);
		let progress;
		if (resetCounterNow !== resetCounterPrev) {
			playLongSound();
			window.navigator.vibrate(2000);

			startTimeMs = now;
			pausedAtMs = 0;
			pausedTimeMs = 0;
			lapCounter = 0;
			progress = 0;
		} else  {
			const lapCounterNow = Math.floor(elapsedTimeMs / lapTimeMs);
			if (lapCounterNow !== lapCounter) {
				playLapSound();
				window.navigator.vibrate(500);
			}
			lapCounter = lapCounterNow;
			progress = (elapsedTimeMs * 100 / lapTimeMs) % 100;
		}

		el.setAttribute('counter', lapCounter);
		el.setAttribute('progress', progress);

		let remainingMs = lapTimeMs - elapsedTimeMs;
		while (remainingMs < 0) {
			remainingMs += lapTimeMs;
		}
		el.setAttribute('remaining-time', remainingMs);
	}, timerIntervalMs);

	showRing();
}

function togglePauseRing() {
	isRingPaused = !isRingPaused;
	handlePauseResume();
}

function handlePauseResume() {
	if (isRingPaused) {
		getPauseButton().textContent ='Resume';
		pausedAtMs = Date.now();
	} else {
		getPauseButton().textContent ='Pause';
		if (pausedAtMs > 0) {
			pausedTimeMs += Date.now() - pausedAtMs;
		}
		pausedAtMs = 0;
	}
}

function playLapSound() {
	const lapAudio = new Audio('../got-it-done-613.mp3');
	if (!lapAudio) return;

	lapAudio.play();
}

function playLongSound() {
	const longAudio = new Audio('../oringz-w437-339.mp3');
	if (!longAudio) return;

	longAudio.play();
}

// Reference: https://css-tricks.com/building-progress-ring-quickly/
