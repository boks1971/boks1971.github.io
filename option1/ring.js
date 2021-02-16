class Ring extends HTMLElement {
	constructor() {
		super();
		const stroke = this.getAttribute('stroke');
		const radius = this.getAttribute('radius');
		const normalizedRadius = radius - stroke * 2;
		const outerRadius = normalizedRadius + stroke / 2;
		const innerRadius = normalizedRadius - stroke / 2;
		this._circumference = normalizedRadius * 2 * Math.PI;

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
					font-size="6em"
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
		const text = this._root.getElementById('ring-counter');
		text.textContent = count;
	}

	static get observedAttributes() {
		return ['progress', 'counter'];
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'progress') {
			this.setProgress(newValue);
		} else if (name === 'counter') {
			this.setCounter(newValue);
		}
	}
}

window.customElements.define('sensory-ring', Ring);

initInput();
initRing();
initSounds();
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
	clearInput();
	showInput();
	focusInput();
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
	el.setAttribute('progress', 0);
	el.setAttribute('counter', lapCounter);

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
			progress = elapsedTimeMs * 100 / lapTimeMs;
		}
		el.setAttribute('counter', lapCounter);
		el.setAttribute('progress', progress);
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

var lapAudio;
var longAudio;

function initSounds() {
	lapAudio = new Audio('./got-it-done-613.mp3');
	longAudio = new Audio('./oringz-w437-339.mp3');
}

function playLapSound() {
	if (!lapAudio) return;

	lapAudio.play();
}

function playLongSound() {
	if (!longAudio) return;

	longAudio.play();
}

// Reference: https://css-tricks.com/building-progress-ring-quickly/

// TODO
// - no input box, just four options, 5, 10, 15, 30
// - Outline circle with circle getting filled in
// - Counter timer mode
