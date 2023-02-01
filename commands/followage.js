const humanize = require('humanize-duration');

module.exports = {
	command: 'followage', // Should match the filename, and the function name in run
	description: 'Gets the followage for any user',
	requiresAdmin: false,
	run: async function followage(Twitch, args, __main) {
		const send = msg => Twitch.Client.say(Twitch.Config.channel, msg);
		let username = __main.tags.username;

		if(args.length > 0)
			username = args[0];

		username = username.toLowerCase().replace('@', '');

		if(username == Twitch.Config.channel.toLowerCase())
			return send(`${username} can't follow themselves, that's illegal!`);

		// Fetch the users and ours id at the same time
		let json = await (await Twitch.HelixRequest(`users?login=${username}&login=${Twitch.Config.channel}`, {})).json();

		if(json.error)
			return send(`Are you sure that ${username} is a real Twitch user? LUL`);

		let data = json.data;
		if(data.length < 2)
			return send(`Are you sure that ${username} is alive or even exists?`);

		const fromID = data[0].id;
		const toID = data[1].id;

		json = await (await Twitch.HelixRequest(`users/follows?from_id=${fromID}&to_id=${toID}&first=1`, {})).json();

		data = json.data[0];

		if(data == undefined)
			return send(`${username} isn't following ${Twitch.Config.channel}... :(`);

		const date = Date.parse(data.followed_at); // NodeJS provides an implementation for Date.parse in RFC3339 format
		return send(`${username} has been following ${Twitch.Config.channel} for ${humanize(Date.now() - date, { round: true })}`);
	}
};