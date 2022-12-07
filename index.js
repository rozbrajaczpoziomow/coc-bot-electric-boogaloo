// This project is licensed with the Roz's license, which should've been included within the root directory of this project, or - https://github.com/rozbrajaczpoziomow/coc-bot-electric-boogaloo/blob/main/LICENSE.txt
// This line is a tribute to me leaking my CG token on the second commit on the repo on GH
// HTTPS_PROXY=http://127.0.0.1:8080 HTTP_PROXY=http://127.0.0.1:8080 NODE_TLS_REJECT_UNAUTHORIZED=0
const AllConfig = require('./config.json');

const CG = {
	Config: AllConfig.CodinGame,
	Request: {
		GET: async function GET(url) {
			console.debug(`[CG  GET] ${url}`);
			return fetch(url, {
				method: 'GET', // TODO: headers.Cookies if no builtin
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
		langs;
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
			'reverse': 'REVERSE'
		};

		static languages = null;
		static languagesLower = null;

		constructor(modes, langs) {
			this.modes = new Set(modes.split(' ').map(mode => CG.Clash.modeMapping[mode] || '').filter(mode => mode));
			this.languages = new Set(langs.split(' ').map(lang => CG.Clash.languagesLower.includes(lang.toLowerCase())? CG.Clash.languages[CG.Clash.languagesLower.indexOf(lang.toLowerCase())] : '').filter(lang => lang));
		}

		async create() {
			this.publicHandle = (await (await CG.Request.POST("https://www.codingame.com/services/ClashOfCode/createPrivateClash", [CG.Config.userId, [...this.languages], [...this.modes]])).json()).publicHandle;
		}

		async start() {
			await CG.Request.POST('https://www.codingame.com/services/ClashOfCode/startClashByHandle', [CG.Config.userId, this.publicHandle]);
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

(async () => {
	await CG.Clash.init();
	const clash = new CG.Clash('fast ver s short shortest rev A', 'Pascal paSCAl ocAMl');
	await clash.create();
	console.log(clash.url);
})();