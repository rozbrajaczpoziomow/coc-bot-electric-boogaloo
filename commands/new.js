module.exports = {
	command: 'new', // Should match the filename, and the function name in run
	description: 'Creates a new clash',
	requiresAdmin: true,
	run: async function New(Twitch, args, __main) { // Have to do New because new is a reserved keyword.
		const send = msg => Twitch.Client.say(Twitch.Config.channel, msg);

		Twitch.CurrentClash = new __main.CG.Clash(args, args);
		if(!await Twitch.CurrentClash.create())
			return send('Creating clash failed (see console)...');
		return send(Twitch.CurrentClash.url);
	}
};