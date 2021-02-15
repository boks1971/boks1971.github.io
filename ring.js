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

	static get observedAttributes() {
		return ['progress'];
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'progress') {
			this.setProgress(newValue);
		}
	}
}

window.customElements.define('sensory-ring', Ring);

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
	document.getElementById("error").style.visibility = "visible";
}

function hideError() {
	const el = document.getElementById('error');
	document.getElementById("error").style.visibility = "hidden";
}

function showInput() {
	document.getElementsByName("duration")[0].style.visibility = "visible";

	const startEl = getStartButton();
	startEl.addEventListener('click', checkInput);
	startEl.style.visibility = "visible";
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
	document.getElementsByName("duration")[0].style.visibility = "hidden";

	const startEl = getStartButton();
	startEl.removeEventListener('click', checkInput);
	startEl.style.visibility = "hidden";
}

function focusInput() {
	document.getElementsByName("duration")[0].focus();
}

function showRing() {
	document.querySelector('sensory-ring').style.visibility = "visible";

	const pauseEl = getPauseButton();
	pauseEl.addEventListener('click', togglePauseRing);
	pauseEl.style.visibility = "visible";

	const resetEl = getResetButton();
	resetEl.addEventListener('click', reset);
	resetEl.style.visibility = "visible";
}

var timer;

function hideRing() {
	if (timer) {
		clearInterval(timer);
	}

	document.querySelector('sensory-ring').style.visibility = "hidden";

	const pauseEl = getPauseButton();
	pauseEl.removeEventListener('click', togglePauseRing);
	pauseEl.style.visibility = "hidden";

	const resetEl = getResetButton();
	resetEl.removeEventListener('click', reset);
	resetEl.style.visibility = "hidden";
}

let isRingPaused = false;
let pausedAt = 0;
let pausedTime = 0;

function resetRing() {
	const el = document.querySelector('sensory-ring');
	el.setAttribute('progress', 0);
}

function launchRing(totalTime) {
	resetRing();
	showRing();

	isRingPaused = false;

	let progress = 0;
	const el = document.querySelector('sensory-ring');
	el.setAttribute('progress', progress);

	const timerInterval = 50;
	const startTime = Date.now();

	timer = setInterval(() => {
		if (isRingPaused) return;

		const elapsedTime = Date.now() - startTime - pausedTime;
		progress = elapsedTime * 100 / totalTime;
		el.setAttribute('progress', progress);
	}, timerInterval);
}

function togglePauseRing() {
	isRingPaused = !isRingPaused;
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
