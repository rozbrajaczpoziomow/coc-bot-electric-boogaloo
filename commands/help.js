const { readdirSync } = require('fs');
const commands = readdirSync('./commands').map(cmd => cmd.slice(0, -3));

module.exports = {
	command: 'help', // Should match the filename, and the function name in run
	description: '...guess?',
	requiresAdmin: false,
	// eslint-disable-next-line no-unused-vars
	run: async function help(Twitch, args, __main) {
		const send = msg => Twitch.Client.say(Twitch.Config.channel, msg);

		if(args.length < 1)
			return send('Commands: ' + commands.map(cmd => Twitch.Config.prefix + cmd).join(', '));

		const find = args[0];

		if(!commands.includes(find))
			return send(`No command found with the name ${find}`);

		const description = require(`./${find}.js`).description;
		return send(`${find} - ${description}`);
	}
};