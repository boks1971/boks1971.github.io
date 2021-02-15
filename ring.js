class Ring extends HTMLElement {
	constructor() {
		super();
		const stroke = this.getAttribute('stroke');
		const radius = this.getAttribute('radius');
		const normalizedRadius = radius - stroke * 2;
		this._circumference = normalizedRadius * 2 * Math.PI;

		this._root = this.attachShadow({mode: 'open'});
		this._root.innerHTML = `
			<svg
				height="${radius * 2}"
				width="${radius * 2}"
			>
				<circle
					stroke="white"
					stroke-dasharray="${this._circumference} ${this._circumference}"
					style="stroke-dashoffset:${this._circumference}"
					stroke-width="${stroke}"
					fill="transparent"
					r="${normalizedRadius}"
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
				circle {
					transition: stroke-dashoffset 0.35s;
					transform: rotate(-90deg);
					transform-origin: 50% 50%;
        			}
			</style>
		`;
	}
  
	setProgress(percent) {
		const offset = this._circumference - (percent / 100 * this._circumference);
		const circle = this._root.querySelector('circle');
		circle.style.strokeDashoffset = offset; 
	}

	setCounter(count) {
		const text = this._root.querySelector('text');
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
let pausedAt = 0;
let pausedTime = 0;

function launchRing(totalTime) {
	isRingPaused = false;
	pausedAt = 0;
	pausedTime = 0;
	handlePauseResume();

	let progress = 0;
	const el = document.querySelector('sensory-ring');
	el.setAttribute('progress', progress);
	el.setAttribute('counter', 0);

	const timerInterval = 50;
	const startTime = Date.now();

	timer = setInterval(() => {
		if (isRingPaused) return;

		const elapsedTime = Date.now() - startTime - pausedTime;
		progress = elapsedTime * 100 / totalTime;
		el.setAttribute('progress', progress);
		el.setAttribute('counter', Math.floor(elapsedTime / totalTime));
	}, timerInterval);

	showRing();
}

function togglePauseRing() {
	isRingPaused = !isRingPaused;
	handlePauseResume();
}

function handlePauseResume() {
	if (isRingPaused) {
		getPauseButton().textContent ='Resume';
		pausedAt = Date.now();
	} else {
		getPauseButton().textContent ='Pause';
		if (pausedAt > 0) {
			pausedTime += Date.now() - pausedAt;
		}
		pausedAt = 0;
	}
}


// TODO
// Show input box in landing screen with a go button
// Reference: https://css-tricks.com/building-progress-ring-quickly/
