/* eslint-disable no-case-declarations */
// This project is licensed with Roz's license, which should've been included within the root directory of this project, or - https://github.com/rozbrajaczpoziomow/coc-bot-electric-boogaloo/blob/main/LICENSE.txt
// This line is a tribute to me leaking my CG token on the second commit on the repo on GH
const AllConfig = require('./config.json');
const tmi = require('tmi.js');
require('child_process').spawn('git', ['pull', '-f'], { shell: true, windowsHide: true, detached: true }).unref();

if(AllConfig.Twitch.evalGlobal)
	for(var i = 0; i < 5; i++)
		console.log('[!!!] Having evalGlobal enabled is a terrible idea... For token safety reasons or something idk...');

async function SaveConfig() {
	const { writeFile } = require('fs');
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
			await CG.Request.POST('https://www.codingame.com/services/TestSession/submit', [this.ideHandle, { code: `Stream: https://twitch.tv/${Twitch.Config.channel}\nBot: https://github.com/rozbrajaczpoziomow/coc-bot-electric-boogaloo`, programmingLanguageId: CG.Clash.languages[Math.floor(Math.random() * CG.Clash.languages.length)] }, null]);
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
Twitch.isAdmin = username => Twitch.Config.admins.includes(username.toLowerCase());
Twitch.EventListeners = {
	// eslint-disable-next-line no-unused-vars
	message: async function onMessage(channel, tags, message, self) {
		const send = msg => Twitch.Client.say(channel, `@${tags.username} ` + msg);
		// if(self) return;
		// console.log(`Message: ${message}`);
		// console.log(`Tags: `, tags);

		if(message.startsWith(`@${Twitch.Config.username} prefix`)) {
			if(!Twitch.isAdmin(tags.username))
				return send(`Current prefix: ${Twitch.Config.prefix}`);
			Twitch.Config.prefix = message.split(' ').last();
			console.log(`[TWITCH] Prefix set, saving new config.json`);
			SaveConfig();
			return send(`Successfully set prefix to ${Twitch.Config.prefix}`);
		}

		if(!message.startsWith(Twitch.Config.prefix)) return;
		const _cmd = message.slice(Twitch.Config.prefix.length).split(' ');
		const cmd = _cmd[0].toLowerCase();
		const args = _cmd.slice(1);

		switch(cmd) {
		/**
       	* request help
       	*
       	* @returns {string} a list of available commands
       	*/
		case 'help':
			let viewerCommands = [
				'!help',
				'!link',
				'!uptime',
				'!playlist',
				'!followage'
			];
			let adminCommands = ['!new', '!start', '!override', '!eval'];

			if(Twitch.isAdmin(tags.username))
				return send(
					`list of commands: ${[...viewerCommands, ...adminCommands].join(
						', '
					)}`
				);

			return send(`sup bru, looking for list of commands?
		today is your lucky day: ${viewerCommands.join(', ')}`);

		/**
       	* request the current clash link
       	*
       	* @returns {string} link to clash
       	*/
		case 'link':
			return send(Twitch.CurrentClash.url ?? 'No clash created yet...');

		/**
       	* create a new clash
       	*
       	* @returns {string} link to clash
       	*/
		case 'new':
			if(!Twitch.isAdmin(tags.username)) return;

			Twitch.CurrentClash = new CG.Clash(args, args);
			if(!(await Twitch.CurrentClash.create()))
				return send('Creating clash failed (see console)...');
			return send(Twitch.CurrentClash.url);

		/**
       	* start the current clash
       	*
       	* @returns {string} link to clash
       	*/
		case 'start':
			if(!Twitch.isAdmin(tags.username)) return;

			if(!Twitch.CurrentClash.start)
				return send(`There hasn't been a clash created.`);

			await Twitch.CurrentClash.start();
			if(CG.Config.autoSubmit)
				setTimeout(() => Twitch.CurrentClash.submit(), 30000);
			break;

		/**
       	* override the current clash link
       	*
       	* @returns {string} overridden link
       	*/
		case 'override':
			if(!Twitch.isAdmin(tags.username)) return;

			if(args.length == 0)
				return send('No link provided, usage: !override <link>');
			if(args.length > 1)
				return send('Too many arguments, usage: !override <link>');
			Twitch.CurrentClash.url = args[0];

			return send(Twitch.CurrentClash.url);

		/**
       	* eval code
       	*
       	* @returns {string} output of code
       	*/
		case 'eval':
			if(!Twitch.Config.evalEnabled) return console.log('Eval is disabled');
			if(!Twitch.Config.evalGlobal && !Twitch.isAdmin(tags.username)) return;

			let out = eval(args.join(' '));
			if(out == null) out = 'No output...';
			if(typeof out == 'object') out = JSON.stringify(out);
			return send(out);
		}
	}
};

Twitch.Client.on('message', Twitch.EventListeners.message);
