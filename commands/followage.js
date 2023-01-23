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

		username = username.toLowerCase();

		if(username == Twitch.Config.channel.toLowerCase())
			return send(`${username} can't follow themselves, that's illegal!`);

		let json = await (await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
			method: 'GET',
			headers: Twitch.HelixAuth
		})).json();

		let data = json.data[0];
		if(data == undefined)
			return send(`Are you sure that ${username} is alive or even exists?`);
		const fromID = data.id;

		json = await (await fetch(`https://api.twitch.tv/helix/users?login=${Twitch.Config.channel}`, {
			method: 'GET',
			headers: Twitch.HelixAuth
		})).json();
		const toID = json.data[0].id; // asserting here that we exist

		json = await (await fetch(`https://api.twitch.tv/helix/users/follows?from_id=${fromID}&to_id=${toID}&first=1`, {
			method: 'GET',
			headers: Twitch.HelixAuth
		})).json();

		data = json.data[0];

		if(data == undefined)
			return send(`${username} isn't following ${Twitch.Config.channel}... :(`);

		const date = Date.parse(data.followed_at); // NodeJS provides an implementation for Date.parse in RFC3339 format
		return send(`${username} has been following ${Twitch.Config.channel} for ${humanize(Date.now() - date, { round: true })}`);
	}
};