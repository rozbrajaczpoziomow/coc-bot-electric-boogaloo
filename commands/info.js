module.exports = {
	command: 'info', // Should match the filename, and the function name in run
	description: 'Get random information',
	requiresAdmin: false,
	// eslint-disable-next-line no-unused-vars
	run: async function info(Twitch, args, __main) {
		const send = msg => Twitch.Client.say(Twitch.Config.channel, msg);
		return send(`/me rozbrajaczpoziomow/coc-bot-electric-boogaloo running ${__main.commitShort}`);
	}
};