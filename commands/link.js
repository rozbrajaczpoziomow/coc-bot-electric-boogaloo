module.exports = {
	command: 'link', // Should match the filename, and the function name in run
	description: 'Gives you the link for the current clash',
	requiresAdmin: false,
	// eslint-disable-next-line no-unused-vars
	run: async function link(Twitch, args, __main) {
		const send = msg => Twitch.Client.say(Twitch.Config.channel, msg);

		return send(Twitch.CurrentClash.url ?? 'No clash created yet...');
	}
};