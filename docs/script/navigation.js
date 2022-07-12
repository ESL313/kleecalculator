const weaponList = document.getElementById('weapon-name').querySelector('.select-options');
let weaponListOutput = [weaponList.innerHTML];
const weapons = loadJSON('/kleecalculator/data/weapons.json');
for (const weapon of Object.keys(weapons)) if (weapon !== 'Apprentice\'s Notes') weaponListOutput.push(`<div class="select-option"><img src="/kleecalculator/media/weapon/${weapon.toLowerCase().replaceAll('\'', '').replaceAll(' ', '_')}/base.png"> ${weapon}</div>`);
weaponList.innerHTML = weaponListOutput.join('\n');

const tabs = document.getElementsByClassName('tab');
for (const tab of tabs) tab.addEventListener('click', changeTab);
let tabTransitionCompleted = true;

const selectMenuOptions = document.getElementsByClassName('select-option');
for (const selectMenuOption of selectMenuOptions) selectMenuOption.addEventListener('click', changeSelection);
let selectTransitionCompleted = true;
document.body.addEventListener('click', toggleSelectMenu);

const increaseButtons = document.getElementsByClassName('range-increase');
const decreaseButtons = document.getElementsByClassName('range-decrease');
for (const increaseButton of increaseButtons) increaseButton.addEventListener('click', updateInputRange);
for (const decreaseButton of decreaseButtons) decreaseButton.addEventListener('click', updateInputRange);
let rangeTransitionCompleted = [];

const modalButtons = document.getElementsByClassName('modal-button');
for (const modalButton of modalButtons) modalButton.addEventListener('click', openModal);
const closeModalButtons = document.getElementsByClassName('modal-close');
for (const closeModalButton of closeModalButtons) closeModalButton.addEventListener('click', closeModal);
const modalAreas = document.getElementsByClassName('modal');
for (const modalArea of modalAreas) modalArea.addEventListener('click', closeModal);

const arrows = document.getElementsByClassName('group-damage-arrow');
for (const arrow of arrows) arrow.addEventListener('click', toggleCollapsible);

const constellations = document.getElementById('constellations').children;
for (const constellation of constellations) constellation.addEventListener('click', updateConstellation);

function changeTab(event) {
	// the tab change feature should be locked while still in animation to prevent possible bugs
	if (!tabTransitionCompleted) return;
	tabTransitionCompleted = false;

	const targetTab = event.target;
	const target = targetTab.id.slice(4);
	const targetContent = document.getElementById(`content-${target}`);
	for (const tab of tabs) tab.classList.remove('selected-tab');
	targetTab.classList.add('selected-tab');

	const positionMap = {
		rotation: '0%',
		stats: '25%',
		buffs: '50%',
		about: '75%'
	};
	document.getElementById('tab-indicator').style.left = positionMap[target];

	const previousContent = document.getElementsByClassName('selected-content')[0];
	previousContent.addEventListener('transitionend', nextTransition);
	previousContent.style.opacity = '0%';

	function nextTransition() {
		previousContent.removeEventListener('transitionend', nextTransition);
		previousContent.classList.remove('selected-content');
		targetContent.classList.add('selected-content');
		targetContent.addEventListener('transitionend', finishTransition);
		targetContent.style.opacity = '100%';
	}

	function finishTransition() {
		targetContent.removeEventListener('transitionend', finishTransition);
		tabTransitionCompleted = true;
	}
}

function changeSelection(event) {
	let target = event.target;
	if (target.tagName === 'IMG') target = target.parentElement;
	const targetIndex = Array.from(target.parentElement.children).indexOf(target);
	const selectMenu = target.parentElement.parentElement;

	// true + false + false = true and so return
	if (selectMenu.id === 'character-level' && rangeTransitionCompleted.includes('normal-attack-level') + rangeTransitionCompleted.includes('elemental-skill-level') + rangeTransitionCompleted.includes('elemental-burst-level')) return;

	if (!selectTransitionCompleted) return;
	selectTransitionCompleted = false;

	if (selectMenu.id === 'character-level') {
		const talentLimit = {
			'1/20': 1,
			'20/20': 1,
			'20/40': 1,
			'40/40': 1,
			'40/50': 2,
			'50/50': 2,
			'50/60': 4,
			'60/60': 4,
			'60/70': 6,
			'70/70': 6,
			'70/80': 8,
			'80/80': 8,
			'80/90': 10,
			'90/90': 10
		}[target.innerHTML];
		const talents = ['normal-attack', 'elemental-skill', 'elemental-burst'];
		for (const talent of talents) {
			const range = document.getElementById(`${talent}-level`);
			range.setAttribute('data-max', talentLimit);
			const output = range.querySelector('.range-current');
			setRangeValue(output, Math.min(parseFloat(output.innerHTML), talentLimit), false, range);
		}
	}

	if (selectMenu.id === 'weapon-name') {
		// weapons JSON is sorted, select menu is sorted, just get the index
		const selectedWeapon = weapons[Object.keys(weapons)[targetIndex]];
		let possibleLevels = ['<div class="select-option selected-option">1/20</div>'];
		for (const level of Object.keys(selectedWeapon)) if (level !== '1/20') possibleLevels.push(`<div class="select-option">${level}</div>`);

		const weaponLevel = document.getElementById('weapon-level');
		const weaponRefinement = document.getElementById('weapon-refinement');

		const weaponLevelOptions = weaponLevel.querySelector('.select-options');
		weaponLevelOptions.innerHTML = possibleLevels.join('\n');
		for (const weaponLevelOption of weaponLevelOptions.children) weaponLevelOption.addEventListener('click', changeSelection);

		changeImage('weapon', target.querySelector('img').src);

		setSelectMenuValue(weaponLevel, 0);
		setSelectMenuValue(weaponRefinement, 0);
	}

	if (selectMenu.id === 'weapon-level') {
		const baseURL = document.getElementById('weapon-image').querySelector('img').src.split('/').slice(0, -1).join('/');
		if (targetIndex < 4) changeImage('weapon', `${baseURL}/base.png`);
		else changeImage('weapon', `${baseURL}/ascended.png`);
	}

	setSelectMenuValue(selectMenu, targetIndex);
}

function setSelectMenuValue(selectMenu, targetIndex) {
	const options = selectMenu.querySelector('.select-options').children;
	const target = options[targetIndex];
	for (const option of options) option.classList.remove('selected-option');
	target.classList.add('selected-option');

	const label = target.parentElement.parentElement.querySelector('.select-content');
	label.addEventListener('transitionend', nextTransition);
	label.classList.add('label-highlight');

	function nextTransition() {
		label.removeEventListener('transitionend', nextTransition);
		label.innerHTML = target.innerHTML;
		label.addEventListener('transitionend', finishTransition);
		label.classList.remove('label-highlight');
	}

	function finishTransition() {
		label.removeEventListener('transitionend', finishTransition);
		selectTransitionCompleted = true;
	}
}

function toggleSelectMenu(event) {
	let target = event.target;
	if (target.tagName === 'IMG') target = target.parentElement;
	const targetOptions = target.parentElement.parentElement.querySelector('.select-options');

	const options = document.getElementsByClassName('select-options');
	for (const option of options) option.classList.remove('options-shown');

	if (target.classList.contains('select-content')) targetOptions.classList.add('options-shown');
}

function updateInputRange(event) {
	const target = event.target;
	const range = target.parentElement;

	if (rangeTransitionCompleted.includes(range.id)) return;
	rangeTransitionCompleted.push(range.id);

	const output = range.querySelector('.range-current');
	const usePercent = range.dataset.percent;
	let oldValue = output.innerHTML;
	if (usePercent) oldValue = oldValue.slice(0, -1);
	const newValue = parseFloat(oldValue) + parseFloat(target.dataset.value);
	if (range.dataset.min <= newValue && newValue <= range.dataset.max) setRangeValue(output, newValue, usePercent, range);
	// don't make indexOf a variable since the index can change anytime
	else rangeTransitionCompleted.splice(rangeTransitionCompleted.indexOf(range.id), 1);
}

function setRangeValue(element, newValue, usePercent, range) {
	const buttons = Array.from(range.children).filter(child => child.classList.contains('range-decrease') || child.classList.contains('range-increase'));
	for (const button of buttons) {
		const predictedValue = newValue + parseFloat(button.dataset.value);
		if (range.dataset.min <= predictedValue && predictedValue <= range.dataset.max) button.classList.remove('range-disable');
		else button.classList.add('range-disable');
	}

	element.addEventListener('transitionend', nextTransition);
	element.classList.add('range-highlight');

	function nextTransition() {
		element.removeEventListener('transitionend', nextTransition);
		if (usePercent) {
			element.innerHTML = `${newValue}%`;
		} else element.innerHTML = newValue;
		element.addEventListener('transitionend', finishTransition);
		element.classList.remove('range-highlight');
	}

	function finishTransition() {
		element.removeEventListener('transitionend', finishTransition);
		rangeTransitionCompleted.splice(rangeTransitionCompleted.indexOf(range.id), 1);
	}
}

function openModal(event) {
	const target = document.getElementById(`${event.target.parentElement.querySelector('img').parentElement.parentElement.id}-modal`);
	target.style.display = 'flex';
	// make the function not sync so transition works
	setTimeout(() => {
		target.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
		target.querySelector('.modal-area').style.transform = 'scale(1, 1)';
	}, 0);
}

function closeModal(event) {
	let target = event.target;

	if (target.classList.contains('modal-close')) target = event.target.parentElement.parentElement.parentElement;
	else if (target.classList.contains('modal')) target = event.target;
	else return;

	target.addEventListener('transitionend', finishTransition);
	target.style.backgroundColor = 'rgba(0, 0, 0, 0)';
	target.querySelector('.modal-area').style.transform = 'scale(0, 0)';

	function finishTransition() {
		target.removeEventListener('transitionend', finishTransition);
		target.style.display = 'none';
	}
}

function toggleCollapsible(event) {
	const parentElement = event.target.parentElement;
	parentElement.classList.toggle('arrow-flipped');
	parentElement.parentElement.parentElement.querySelector('.group-damage-content').classList.toggle('content-shown');
}

function updateConstellation(event) {
	const target = event.target;

	let highlighted = false;
	let i = 0;
	while (!highlighted && i < 6) {
		if (constellations[i].classList.contains('constellation-highlight')) i++;
		else highlighted = true;
	}

	if (target.id === `constellation_${i}`) highlight(0);
	else highlight(parseInt(target.id.slice(-1)));

	function highlight(amount) {
		for (const constellation of constellations) constellation.classList.remove('constellation-highlight');
		for (let j = 0; j < amount; j++) {
			constellations[j].classList.add('constellation-highlight');
		}
	}
}

function changeImage(type, imageURL) {
	setImage(document.getElementById(type).querySelector('.content-image'));
	setImage(document.getElementById(`${type}-image`).querySelector('.content-image'));
	function setImage(element) {
		element.addEventListener('transitionend', finishTransition);
		element.style.opacity = '0%';

		function finishTransition() {
			element.removeEventListener('transitionend', finishTransition);
			element.innerHTML = `<img src="${imageURL}">`;
			element.style.opacity = '100%';
		}
	}
}

function loadJSON(url) {
	let output = {};
	let request = new XMLHttpRequest();
	request.open('GET', url, false);
	request.onload = () => {
		if (request.status === 200) {
			output = JSON.parse(request.response);
		} else {
			// handle error somehow, probably gonna just say that this tool does not support old browsers or something
		}
	};
	request.send();
	return output;
}
