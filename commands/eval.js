module.exports = {
	command: 'eval', // Should match the filename, and the function name in run
	description: 'Evaluates code',
	requiresAdmin: true,
	// eslint-disable-next-line no-unused-vars
	run: async function Eval(Twitch, args, __main) {
		const send = msg => Twitch.Client.say(Twitch.Config.channel, msg);

		if(!Twitch.Config.evalEnabled)
			return send('Eval is disabled');

		const code = args.join(' ');

		let out = '<nothing>';
		try {
			out = eval(code);
			if(out == null) out = 'No output...';
			if(typeof out != 'string') out = JSON.stringify(out);
			return send(out);
		} catch(e) {
			console.error(e);
			return send(e.toString());
		}
	}
};