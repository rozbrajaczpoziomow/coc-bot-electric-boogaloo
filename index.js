// This project is licensed with the Roz's license, which should've been included within the root directory of this project, or - https://github.com/rozbrajaczpoziomow/coc-bot-electric-boogaloo/blob/main/LICENSE.txt
// This line is a tribute to me leaking my CG token on the second commit on the repo on GH
const AllConfig = require('./config.json');
const tmi = require('tmi.js');

async function SaveConfig() {
	const { writeFile } = require('fs');
	writeFile('./config.json', JSON.stringify(AllConfig, null, 4), () => {});
}

Array.prototype.last = function last() { return this[this.length - 1]; }

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
			console.debug(`[CG POST] ${url}`);
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

			if(this.modes.length == 0)
				this.modes = new Set(Object.values(CG.Clash.modeMapping));

			if(this.languages.length == 0)
				this.languages = new Set(CG.Clash.languages);
		}

		async create() {
			this.publicHandle = (await (await CG.Request.POST("https://www.codingame.com/services/ClashOfCode/createPrivateClash", [CG.Config.userId, [...this.languages], [...this.modes]])).json()).publicHandle;
			// For debugging ;p
			// console.log(await (await CG.Request.POST("https://www.codingame.com/services/ClashOfCode/createPrivateClash", [CG.Config.userId, [...this.languages], [...this.modes]])).json());
		}

		async start() {
			await CG.Request.POST('https://www.codingame.com/services/ClashOfCode/startClashByHandle', [CG.Config.userId, this.publicHandle]);
		}

		async submit() {
			await CG.Request.POST('https://www.codingame.com/services/TestSession/submit', [this.publicHandle, { code: `Stream: https://twitch.tv/${Twitch.Config.channel}\nBot: https://github.com/rozbrajaczpoziomow/coc-bot-electric-boogaloo`, programmingLanguageId: CG.Clash.languages[Math.floor(Math.random() * CG.Clash.languages.length)] }, null]);
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
Twitch.EventListeners = {
	message: async function onMessage(channel, tags, message, self) {
		const send = msg => Twitch.Client.say(channel, msg);
		// if(self) return;
		// console.log(`Message: ${message}`);
		// console.log(`Tags: `, tags);
		if(message.startsWith(`@${Twitch.Config.username} prefix`)) {
			if(!Twitch.Config.admins.includes(tags.username.toLowerCase()))
				return send(`Current prefix: ${Twitch.Config.prefix}`);
			Twitch.Config.prefix = message.split(' ').last();
			SaveConfig();
			console.log(`[TWITCH] New prefix set, saving new config.json`);
			return send(`Successfully set prefix to ${Twitch.Config.prefix}`);
		}

		if(!message.startsWith(Twitch.Config.prefix)) return;
		const _cmd = message.slice(Twitch.Config.prefix.length).split(' ');
		const cmd = _cmd[0];
		const args = _cmd.slice(1);

		if(cmd == 'link')
			return send(Twitch.CurrentClash.url ?? 'No clash created yet...');

		if(cmd == 'new') {
			if(!Twitch.Config.admins.includes(tags.username.toLowerCase()))
				return send(Twitch.CurrentClash.url);
			Twitch.CurrentClash = new CG.Clash(args, args);
			await Twitch.CurrentClash.create();
			return send(Twitch.CurrentClash.url);
		}

		if(cmd == 'start') {
			if(!Twitch.Config.admins.includes(tags.username.toLowerCase()))
				return send(Twitch.CurrentClash.url);

			if(Twitch.CurrentClash == {})
				return send(`There hasn't been a clash created.`);

			await Twitch.CurrentClash.start();
			if(CG.Config.autoSubmit)
				setTimeout(() => Twitch.CurrentClash.submit(), 10000);
		}

		if(cmd == 'eval') {
			if(!Twitch.Config.admins.includes(tags.username.toLowerCase()))
				return send('I do not give you consent to use that command...mate...that\'s too dangerous...');
			let out = eval(args.join(' '));
			if(out == null) out = 'No output...'
			if(typeof out == 'object') out = JSON.stringify(out);
			return send(out);
		}
	}
};

Twitch.Client.on('message', Twitch.EventListeners.message);