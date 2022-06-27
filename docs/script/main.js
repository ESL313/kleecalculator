let calcSettings = {
	stats: {
		level: 1,
		talent_normal_attack: 1,
		talent_elemental_skill: 1,
		talent_elemental_burst: 1,
		constellation: 0,
		hp_base: 801,
		hp_percentage: 0,
		hp_flat: 0,
		atk_base: 47,
		atk_percentage: 0,
		atk_flat: 0,
		def_base: 48,
		def_percentage: 0,
		def_flat: 0,
		em: 0,
		crit_rate: 0.05,
		crit_dmg: 0.50,
		er: 1,
		dmg_bonus: 0,
		flat_dmg: 0,
		def_reduction: 0,
		def_ignore: 0,
		amp_bonus: 0,
		reaction_bonus: 0,
		enemy_level: 1,
		enemy_elemental_res: 0.1
	},
	hits: {
		normal_attack_1: {
			instance: 5,
			buffs: {},
			partials: {}
		},
		normal_attack_2: {
			instance: 0,
			buffs: {},
			partials: {}
		},
		normal_attack_3: {
			instance: 0,
			buffs: {},
			partials: {}
		},
		charge_attack: {
			instance: 4,
			buffs: {},
			partials: {}
		},
		elemental_skill_bounce: {
			instance: 3,
			buffs: {},
			partials: {}
		},
		elemental_skill_mines: {
			instance: 8,
			buffs: {},
			partials: {}
		},
		elemental_burst: {
			instance: 22.8,
			buffs: {},
			partials: {}
		},
		constellation_1: {
			instance: 0,
			buffs: {},
			partials: {}
		},
		constellation_4: {
			instance: 0,
			buffs: {},
			partials: {}
		}
	}
};

const kleeScaling = loadJSON('/kleecalculator/data/klee-scaling.json');

const weapons = loadJSON('/kleecalculator/data/weapons.json');

function openTab(tab, element) {
	const tabs = document.getElementsByClassName('tab');
	for (let i = 0; i < tabs.length; i++) tabs[i].style.display = 'none';

	const tablinks = document.getElementsByClassName('tablink');
	for (let i = 0; i < tablinks.length; i++) tablinks[i].style.backgroundColor = '#222';

	document.getElementById(tab).style.display = 'block';
	element.style.backgroundColor = '#444';
}

// opens the default tab
openTab('rotation', document.getElementsByClassName('tablink')[0]);

function updateRotation(input) {
	input = input.toUpperCase();

	let rotation = expandGroups(input);
	rotation = rotation.replaceAll('N2', 'N1N2').replaceAll('N3', 'N1N2N3');

	if (/^(N1|N2|N3|C|E|Q|\s)*$/.test(rotation)) {
		document.getElementById('rotation-input-error').innerHTML = '';
	} else {
		document.getElementById('rotation-input-error').innerHTML = 'Invalid Rotation';
		rotation = '';
	}

	let hitcounts = {
		N1: 0,
		N2: 0,
		N3: 0,
		C: 0,
		E: 0,
		Q: 0
	};

	for (const hitcount in hitcounts) {
		let lastPosition = rotation.indexOf(hitcount);
		while (lastPosition !== -1) {
			lastPosition = rotation.indexOf(hitcount, lastPosition + 1);
			hitcounts[hitcount]++;
		}
	}

	calcSettings.hits.normal_attack_1.instance = hitcounts.N1;
	calcSettings.hits.normal_attack_2.instance = hitcounts.N2;
	calcSettings.hits.normal_attack_3.instance = hitcounts.N3;
	calcSettings.hits.charge_attack.instance = hitcounts.C;
	calcSettings.hits.elemental_skill_bounce.instance = 3 * hitcounts.E;
	calcSettings.hits.elemental_skill_mines.instance = 8 * hitcounts.E;
	calcSettings.hits.elemental_burst.instance = 22.8 * hitcounts.Q;

	updateOutput(calculate(calcSettings));
}

document.getElementById('rotation-input').value = 'N1EQ 4(N1C)';
updateRotation('N1EQ 4(N1C)');

function expandGroups(text) {
	let output = '';
	let i = 0;
	let startIndex = -1;
	while (i < text.length) {
		if (/[1-9]/.test(text[i])) {
			if (text[++i] === '(') startIndex = i;
		}
		if (text[i] === ')' && startIndex !== -1) {
			const repeat = parseInt(text[startIndex - 1]);
			output += text.substring(0, startIndex - 1);
			for (let j = 0; j < repeat; j++) output += text.substring(startIndex + 1, i);
			output += text.substring(i + 1);
			// could be any number as long as it cancels the while loop
			i = text.length;
		}
		if (text[i] === 'N') i++;
		i++;
	}
	if (output === '') output = text;
	if (output !== text) output = expandGroups(output);

	return output;
}

function updateStats() {
	const errorOutput = document.getElementById('enemy-input-error');
	let enemy_level = parseFloat(document.getElementById('enemy_level').value);
	let enemy_elemental_res = parseFloat(document.getElementById('enemy_elemental_res').value);
	if ((1 > enemy_level || enemy_level > 100) || !Number.isInteger(enemy_level)) {
		errorOutput.innerHTML = 'Enemy level is invalid.';
		enemy_level = 1;
	} else if ((-100 > enemy_elemental_res || enemy_elemental_res > 100) || !Number.isInteger(enemy_elemental_res)) {
		errorOutput.innerHTML = 'Enemy elemental resistance is invalid.';
		enemy_elemental_res = 10;
	} else errorOutput.innerHTML = '';
	let level = document.getElementById('level').value;
	for (const stat in kleeScaling.level[level]) calcSettings.stats[stat] = kleeScaling.level[level][stat];

	// placeholder for weapon code
	let selectedWeapon = weapons.WeaponList[document.getElementById("weapon_name").value];
	calcSettings.stats.atk_base += weapons.BaseATKScaling[selectedWeapon.Star][selectedWeapon.BaseATK][document.getElementById("weapon_level").selectedIndex];
	calcSettings.stats[selectedWeapon.Substat] += weapons.SubstatScaling[selectedWeapon.BaseSub][Math.ceil(document.getElementById("weapon_level").selectedIndex/2)]

	calcSettings.stats.level = parseInt(level.split('/')[0]);
	calcSettings.stats.talent_normal_attack = document.getElementById('talent_normal_attack').value;
	calcSettings.stats.talent_elemental_skill = document.getElementById('talent_elemental_skill').value;
	calcSettings.stats.talent_elemental_burst = document.getElementById('talent_elemental_burst').value;
	calcSettings.stats.enemy_level = enemy_level;
	calcSettings.stats.enemy_elemental_res = enemy_elemental_res / 100;

	updateOutput(calculate(calcSettings));
}

function calculate(input) {
	let output = {};

	for (const hit in input.hits) {
		let stats = {};
		for (const stat in input.stats) stats[stat] = input.stats[stat];

		for (const buff in input.hits[hit].buffs) stats[buff] += input.hits[hit].buffs[buff];

		// damage formula source: https://library.keqingmains.com/combat-mechanics/damage/damage-formula
		if (stats.crit_rate > 1) stats.crit_rate = 1;

		if (stats.def_reduction > 0.9) stats.def_reduction = 0.9;

		if (stats.enemy_elemental_res < 0) stats.elemental_res_multi = 1 - (stats.enemy_elemental_res / 2);
		else if (stats.enemy_elemental_res >= 0.75) stats.elemental_res_multi = 1 / (4 * stats.enemy_elemental_res + 1);
		else stats.elemental_res_multi = 1 - stats.enemy_elemental_res;

		if (stats.amp_bonus === 0) stats.reaction_multi = 1;
		else stats.reaction_multi = stats.amp_bonus * (1 + ((2.78 * stats.em) / (1400 + stats.em)) + stats.reaction_bonus);


		let talentValue = 1;
		if (kleeScaling.talents[hit]) talentValue = kleeScaling.talents[hit].scaling[stats[kleeScaling.talents[hit].scaleWith]];

		output[hit] = input.hits[hit].instance * Math.round(((talentValue * (stats.atk_base * (1 + stats.atk_percentage) + stats.atk_flat)) + stats.flat_dmg) * (1 + stats.dmg_bonus) * (1 + stats.crit_rate * stats.crit_dmg) * ((stats.level + 100) / ((stats.level + 100) + (stats.enemy_level + 100) * (1 - stats.def_reduction) * (1 - stats.def_ignore))) * stats.elemental_res_multi * stats.reaction_multi);
	}

	return output;
}

function updateOutput(input) {
	let output = '';

	let total = 0;
	for (const hit in input) {
		output += `${hit}: ${input[hit].toFixed(2)}<br>`;
		total += input[hit];
	}
	output += `total: ${total.toFixed(2)}`;

	document.getElementById('output').innerHTML = output;
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

// Weapon stuff
function updateLevel() {
	let selectedWeapon = document.getElementById("weapon_name").value;
	let disable70 = weapons.WeaponList[selectedWeapon].Star < 3;
	let list70 = document.getElementsByClassName("70+");
	Array.from(list70).forEach(element => {
		element.disabled = disable70;
	}); 
	document.getElementById("weapon_level").selectedIndex = 0;
	updateStats();
}

function addWeaponSelection() {
	let weaponSelection = document.getElementById("weapon_name");
	let weaponNames = Object.keys(weapons.WeaponList);
	weaponNames.forEach(element => {
		let option = document.createElement("option");
		option.text = element;
		option.value = element;
		weaponSelection.add(option);
	});
	updateLevel();
}
addWeaponSelection();