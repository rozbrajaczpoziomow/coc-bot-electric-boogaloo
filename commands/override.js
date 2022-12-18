module.exports = {
	command: 'override', // Should match the filename, and the function name in run
	description: 'Overrides the current clash',
	requiresAdmin: true,
	run: async function override(Twitch, args, __main) {
		const send = msg => Twitch.Client.say(Twitch.Config.channel, msg);
		if(args.length < 1)
			return send('Provide a link or clash handle as an argument.');

		Twitch.CurrentClash = new __main.CG.Clash([], []);
		Twitch.CurrentClash.publicHandle = args[0].split('/').last();

		return send(Twitch.CurrentClash.url);
	}
};