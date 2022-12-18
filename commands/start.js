module.exports = {
	command: 'start', // Should match the filename, and the function name in run
	description: 'Starts the current clash.',
	requiresAdmin: true,
	run: async function start(Twitch, args, __main) {
		const send = msg => Twitch.Client.say(Twitch.Config.channel, msg);

		if(!Twitch.CurrentClash.start)
			return send(`There hasn't been a clash created.`);

		await Twitch.CurrentClash.start();
		if(__main.CG.Config.autoSubmit)
			setTimeout(() => Twitch.CurrentClash.submit(), 30000);
	}
};