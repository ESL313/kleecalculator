const https = require('https');
const fs = require('fs');

const projectPath = __dirname.split('\\').slice(0, -1).join('/');

const subcommand = process.argv[2].toLowerCase();

// to input items with spaces, type it between quotation marks, like so: npm run import weapon "Dodoco Tales"
let item = process.argv[3];
// Fandom Wiki's url encoder is wack, have to manually replace characters
item = item.replaceAll(' ', '_').replaceAll('\'', '%27');

const artifactRegex = /https:\/\/static\.wikia\.nocookie\.net\/gensin-impact\/images\/.\/..\/\S+?\/revision\/latest\/scale-to-width-down\/60\?cb=\d+/g;
const characterRegex = /https:\/\/static\.wikia\.nocookie\.net\/gensin-impact\/images\/.\/..\/\S+?\/revision\/latest\/scale-to-width-down\/45\?cb=\d+/g;
const characterIconRegex = /https:\/\/static\.wikia\.nocookie\.net\/gensin-impact\/images\/.\/..\/Character_\S+?_Thumb\.png\/revision\/latest\/scale-to-width-down\/120\?cb=\d+/;
const weaponRegex = /https:\/\/static\.wikia\.nocookie\.net\/gensin-impact\/images\/.\/..\/Weapon_\S+?\/revision\/latest\?cb=\d+/g;
const weaponSubstatRegex = /\(<span class="[a-z-]+"><b>.+?<\/b><\/span>\)/;
const weaponStatsRegex = /<td>[\d/.%]+\n?<\/td>/g;

// this line is hoisted and belongs to the fetch code
let tasks = 0;

if (subcommand === 'artifact') {
	fetch(`https://genshin-impact.fandom.com/wiki/${item}`, data => {
		const imageURLs = data.match(artifactRegex);
		const pieces = ['flower', 'plume', 'sands', 'goblet', 'circlet'];

		for (let i = 0; i < 5; i++) {
			const filePath = `${projectPath}/docs/media/artifact/${item.toLowerCase().replaceAll('%27', '')}/${pieces[i]}.png`;
			if (!fs.existsSync(filePath)) {
				fs.mkdirSync(filePath.split('/').slice(0, -1).join('/'), { recursive: true });
			}
			fetch(imageURLs[i].split('/').slice(0, -2).join('/'), image => {
				fs.writeFileSync(filePath, image, 'binary');
			});
		}
	});
} else if (subcommand === 'character') {
	let hasAlternateSprint = process.argv[4] || 'false';
	if (hasAlternateSprint === 'true') hasAlternateSprint = 0;
	else if (hasAlternateSprint === 'false') hasAlternateSprint = 1;
	else throw console.log('Third argument must be either true or false.');
	fetch(`https://genshin-impact.fandom.com/wiki/${item}`, data => {
		const imageURLs = data.match(characterRegex);
		const combatTalents = ['normal_attack', 'elemental_skill', 'elemental_burst'];
		const passiveTalents = ['alternate_sprint', 'first_ascension', 'fourth_ascension', 'utility_passive_1', 'utility_passive_2'];
		const passiveTalentURLs = imageURLs.slice(3, -6);

		for (let i = 0; i < 3; i++) {
			const filePath = `${projectPath}/docs/media/character/${item.toLowerCase().replaceAll('%27', '')}/${combatTalents[i]}.png`;
			if (!fs.existsSync(filePath)) {
				fs.mkdirSync(filePath.split('/').slice(0, -1).join('/'), { recursive: true });
			}
			fetch(imageURLs[i].split('/').slice(0, -2).join('/'), image => {
				fs.writeFileSync(filePath, image, 'binary');
			});
		}

		for (let i = 0; i < passiveTalentURLs.length; i++) {
			const filePath = `${projectPath}/docs/media/character/${item.toLowerCase().replaceAll('%27', '')}/${passiveTalents[i + hasAlternateSprint]}.png`;
			if (!fs.existsSync(filePath)) {
				fs.mkdirSync(filePath.split('/').slice(0, -1).join('/'), { recursive: true });
			}
			fetch(imageURLs[i + 3].split('/').slice(0, -2).join('/'), image => {
				fs.writeFileSync(filePath, image, 'binary');
			});
		}

		for (let i = 1; i <= 6; i++) {
			const filePath = `${projectPath}/docs/media/character/${item.toLowerCase().replaceAll('%27', '')}/constellation_${i}.png`;
			if (!fs.existsSync(filePath)) {
				fs.mkdirSync(filePath.split('/').slice(0, -1).join('/'), { recursive: true });
			}
			fetch(imageURLs[i + imageURLs.length - 7].split('/').slice(0, -2).join('/'), image => {
				fs.writeFileSync(filePath, image, 'binary');
			});
		}
	});
	fetch(`https://genshin-impact.fandom.com/wiki/${item}/Media`, data => {
		const imageURL = data.match(characterIconRegex)[0];
		const filePath = `${projectPath}/docs/media/character/${item.toLowerCase().replaceAll('%27', '')}/icon.png`;
		if (!fs.existsSync(filePath)) {
			fs.mkdirSync(filePath.split('/').slice(0, -1).join('/'), { recursive: true });
		}
		fetch(imageURL.split('/').slice(0, -2).join('/'), image => {
			fs.writeFileSync(filePath, image, 'binary');
		});
	});
} else if (subcommand === 'weapon') {
	let fecthStats = process.argv[4] || 'false';
	if (fecthStats === 'true') fecthStats = true;
	else if (fecthStats === 'false') fecthStats = false;
	else throw console.log('Third argument must be either true or false.');

	fetch(`https://genshin-impact.fandom.com/wiki/${item}`, data => {
		const imageURLs = data.match(weaponRegex);
		const type = ['base', 'ascended'];

		for (let i = 0; i < 2; i++) {
			const filePath = `${projectPath}/docs/media/weapon/${item.toLowerCase().replaceAll('%27', '')}/${type[i]}.png`;
			if (!fs.existsSync(filePath)) {
				fs.mkdirSync(filePath.split('/').slice(0, -1).join('/'), { recursive: true });
			}
			fetch(imageURLs[i * 4 + 1], image => {
				fs.writeFileSync(filePath, image, 'binary');
			});
		}

		if (fecthStats) {
			let weaponName = process.argv[3];
			let weaponStat = {};
			const substatKeys = {
				'ATK': 'atk_percent',
				'HP': 'hp_percent',
				'DEF': 'def_percent',
				'Energy Recharge': 'er',
				'Elemental Mastery': 'em',
				'CRIT Rate': 'crit_rate',
				'CRIT DMG': 'crit_dmg',
				'Physical DMG Bonus': 'physical_bonus'
			};

			let substat = data.match(weaponSubstatRegex);
			const stats = data.match(weaponStatsRegex);
			if (substat) {
				substat = substatKeys[substat[0].split('<b>')[1].split('</b>')[0].trim()];
				for (let i = 0; i < stats.length / 3; i++) {
					const level = stats[3 * i].split('<td>')[1].split('</td>')[0].trim();
					weaponStat[level] = {};
					weaponStat[level].atk_base = parseFloat(stats[3 * i + 1].split('<td>')[1].split('</td>')[0].trim());
					weaponStat[level][substat] = parseFloat(stats[3 * i + 2].split('<td>')[1].split('</td>')[0].trim());
				}
			} else for (let i = 0; i < stats.length / 2; i++) {
				const level = stats[2 * i].split('<td>')[1].split('</td>')[0].trim();
				weaponStat[level] = {};
				weaponStat[level].atk_base = parseFloat(stats[2 * i + 1].split('<td>')[1].split('</td>')[0].trim());
			}

			let json = require(`${projectPath}/docs/data/weapons.json`);
			json[weaponName] = weaponStat;

			json = Object.keys(json).sort().reduce((obj, key) => {
				obj[key] = json[key];
				return obj;
			}, {});

			fs.writeFileSync(`${projectPath}/docs/data/weapons.json`, JSON.stringify(json), 'utf-8');
		}
	});
} else if (subcommand === 'link') {
	item = process.argv[3];
	const destination = process.argv[4];

	const filePath = `${projectPath}/docs/media/${destination}`;

	if (!fs.existsSync(filePath)) {
		fs.mkdirSync(filePath.split('/').slice(0, -1).join('/'), { recursive: true });
	}
	fetch(item, image => {
		fs.writeFileSync(filePath, image, 'binary');
	});
} else throw console.log('Argument must be either "Artifact", "Character", or "Weapon".');

// to prevent the website to think that we are spamming, delay every request by 5 seconds
function fetch(url, callback) {
	setTimeout(() => {
		https.get(url, response => {
			response.setEncoding('binary');

			let body = '';
			response.on('data', chunk => body += chunk);
			response.on('end', () => {
				callback(body);
				tasks--;
			});
			response.on('error', error => {
				throw console.log(error);
			});

		}).on('error', error => {
			setTimeout(() => {
				fetch(url, callback);
			}, 5000);
			console.log(error);
			console.log('Retrying...');
		});
	}, tasks * 5000);
	tasks++;
}
