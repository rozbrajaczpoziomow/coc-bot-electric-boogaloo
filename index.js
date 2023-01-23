// This project is licensed with Roz's license, which should've been included within the root directory of this project, or - https://github.com/rozbrajaczpoziomow/coc-bot-electric-boogaloo/blob/main/LICENSE.txt
// This line is a tribute to me leaking my CG token on the second commit on the repo on GH
const AllConfig = require('./config.json');
const tmi = require('tmi.js');
const { writeFile, readdirSync } = require('fs');
const { spawnSync } = require('child_process');
const commit = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { shell: true, windowsHide: true, detached: true }).stdout.toString();

async function SaveConfig() {
	writeFile('./config.json', JSON.stringify(AllConfig, null, 4), () => {});
}
Array.prototype.last = function last() { return this[this.length - 1]; };

const CG = {
	Config: AllConfig.CodinGame,
	Request: {
		GET: async function GET(url) {
			console.debug(`[CG  GET] ${url}`);
			return fetch(url, {
				method: 'GET',
				headers: {
					Cookie: `cgSession=${CG.Config.token}`
				}
			});
		},
		POST: async function POST(url, data) {
			console.debug(`[CG POST] ${url} - `, data);
			return fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': typeof data == 'object'? 'application/json' : 'application/x-www-url-encoded',
					Cookie: `cgSession=${CG.Config.token}`
				},
				body: typeof data == 'object'? JSON.stringify(data) : data
			});
		}
	},
	Clash: class Clash {
		modes;
		languages;
		publicHandle;
		ideHandle;

		static modeMapping = {
			'f': 'FASTEST',
			'fast': 'FASTEST',
			'fastest': 'FASTEST',
			's': 'SHORTEST',
			'short': 'SHORTEST',
			'shortest': 'SHORTEST',
			'r': 'REVERSE',
			'rev': 'REVERSE',
			'ver': 'REVERSE',
			'reverse': 'REVERSE',
			'reversimus': 'REVERSE'
		};

		static languages = null;
		static languagesLower = null;

		constructor(modes, langs) {
			this.modes = new Set(modes.map(mode => CG.Clash.modeMapping[mode] || '').filter(mode => mode));
			this.languages = new Set(langs.map(lang => CG.Clash.languagesLower.includes(lang.toLowerCase())? CG.Clash.languages[CG.Clash.languagesLower.indexOf(lang.toLowerCase())] : '').filter(lang => lang));
		}

		async create() {
			const req = await CG.Request.POST('https://www.codingame.com/services/ClashOfCode/createPrivateClash', [CG.Config.userId, [...this.languages], [...this.modes]]);
			const json = await req.json();

			if(req.status != 200) {
				console.error(`* [CG] Creating clash failed with code ${req.status}, server returned the following data:`);
				console.error(json);
				return false;
			}

			this.publicHandle = json.publicHandle;
			return true;
		}

		async start() {
			await CG.Request.POST('https://www.codingame.com/services/ClashOfCode/startClashByHandle', [CG.Config.userId, this.publicHandle]);
		}

		async submit() {
			console.log(`[CG] Submitting for clash ${this.publicHandle}`);
			this.ideHandle = (await (await CG.Request.POST('https://www.codingame.com/services/ClashOfCode/startClashTestSession', [CG.Config.userId, this.publicHandle])).json()).handle;
			await CG.Request.POST('https://www.codingame.com/services/TestSession/submit', [this.ideHandle, { code: `Stream: https://twitch.tv/${Twitch.Config.channel}\nBot: https://github.com/rozbrajaczpoziomow/coc-bot-electric-boogaloo @ ${commit}`, programmingLanguageId: CG.Clash.languages[Math.floor(Math.random() * CG.Clash.languages.length)] }, null]);
			await CG.Request.POST('https://www.codingame.com/services/ClashOfCode/shareCodinGamerSolutionByHandle', [CG.Config.userId, this.publicHandle]);
		}

		get url() {
			return `https://www.codingame.com/clashofcode/clash/${this.publicHandle}`;
		}

		static async init() {
			this.languages = await (await CG.Request.POST('https://www.codingame.com/services/ProgrammingLanguage/findAllIds', [])).json();
			this.languagesLower = this.languages.map(x => x.toLowerCase());
		}
	}
};

CG.Clash.init();

const Twitch = {};
Twitch.Config = AllConfig.Twitch;
Twitch.Client = new tmi.Client({
	options: {
		debug: true
	},
	identity: {
		username: Twitch.Config.username,
		password: Twitch.Config.token
	},
	channels: [
		Twitch.Config.channel
	]
});

Twitch.Client.connect();
Twitch.CurrentClash = {};
Twitch.HelixAuth = {
	Authorization: `Bearer ${Twitch.Config.token.slice(6)}`,
	'Client-Id': Twitch.Config.clientID
};
Twitch.Commands = readdirSync('./commands').map(fn => require(`./commands/${fn}`));
console.log('[TWITCH] Loaded commands:');
console.log(Twitch.Commands);
Twitch.isAdmin = username => Twitch.Config.admins.includes(username.toLowerCase());
Twitch.EventListeners = {
	// eslint-disable-next-line no-unused-vars
	message: async function onMessage(channel, tags, message, self) {
		const send = msg => Twitch.Client.say(channel, msg);
		// if(self) return;
		// console.log(`Message: ${message}`);
		// console.log(`Tags: `, tags);
		if(message.toLowerCase().startsWith(`@${Twitch.Config.username.toLowerCase()} prefix`)) {
			if(!Twitch.isAdmin(tags.username))
				return send(`Current prefix: ${Twitch.Config.prefix}`);
			Twitch.Config.prefix = message.split(' ').last();
			console.log(`[TWITCH] Prefix set, saving new config.json`);
			SaveConfig();
			return send(`Successfully set prefix to ${Twitch.Config.prefix}`);
		}

		if(!message.startsWith(Twitch.Config.prefix)) return;
		const _cmd = message.slice(Twitch.Config.prefix.length).split(' ');
		const name = _cmd[0].toLowerCase();
		const args = _cmd.slice(1);

		const matchingCommands = Twitch.Commands.filter(cmd => cmd.command == name);

		if(matchingCommands.length == 0)
			return console.log('[TWITCH] No matching commands found.');
		else if(matchingCommands.length > 1)
			return console.log(`[TWITCH] ${matchingCommands.length} commands matches for message '${message}' - ${matchingCommands.map(x => x.command).join(', ')}`);
		
		const command = matchingCommands[0];

		if(Twitch.Config.disabledCommands.includes(command.command.toLowerCase()))
			return console.log(`[TWITCH] @${tags.username} tried to run a disabled command ${name}`);

		if(command.requiresAdmin && !Twitch.isAdmin(tags.username.toLowerCase()))
			return console.log(`[TWITCH] @${tags.username} has insufficient permissions to run ${name}.`);

		command.run(Twitch, args, { CG, commit, tags, SaveConfig });
	},
	// eslint-disable-next-line no-unused-vars
	ban: async function onBan(channel, message, _, tags) {
		const send = msg => Twitch.Client.say(channel, msg);
		send(Twitch.Config.announceBanMessage.replaceAll('$user', message));
	}
};

Twitch.Client.on('message', Twitch.EventListeners.message);

if(Twitch.Config.announceBan)
	Twitch.Client.on('ban', Twitch.EventListeners.ban);