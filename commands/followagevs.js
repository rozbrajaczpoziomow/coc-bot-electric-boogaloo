const humanize = require('humanize-duration');

module.exports = {
	command: 'followagevs', // Should match the filename, and the function name in run
	description: 'Checks which user has followed the streamer for longer',
	requiresAdmin: false,
	run: async function followagevs(Twitch, args, __main) {
		const send = msg => Twitch.Client.say(Twitch.Config.channel, msg);

		if(args.length == 0)
			return send('Who am I supposed to compare? Yourself to yourself?');

		let user1 = (args.length == 1? __main.tags.username : args[0]).toLowerCase().replace('@', '');
		let user2 = (args.length == 1? args[0] : args[1]).toLowerCase().replace('@', '');

		if(user1 == Twitch.Config.channel.toLowerCase() || user2 == Twitch.Config.channel.toLowerCase())
			return send(`The streamer has followed themselves for longer than you could ever imagine!`);

		let json = await (await Twitch.HelixRequest(`users?login=${user1}&login=${user2}&login=${Twitch.Config.channel}`, {})).json();

		if(json.error)
			return send(`Are you sure that either ${user1} or ${user2} are real Twitch users? LUL`);

		let data = json.data;

		if(data.length < 3) {
			if(data.length == 1)
				return send('What is this fake data you\'re giving me?');
			let blame = data.map(d => d.login).includes(user1) ? user2 : user1;
			return send(`Are you sure that ${blame} is a real twitch user? LUL`);
		}

		console.log(data);

		const user1ID = data[0].id;
		const user2ID = data[1].id;
		const streamerID = data[2].id;

		console.log(user1ID, user2ID, streamerID);

		let user1followage = ((await (await Twitch.HelixRequest(`users/follows?from_id=${user1ID}&to_id=${streamerID}&first=1`, {})).json()));
			// .data)[0]?.followed_at ?? 0;
		let user2followage = ((await (await Twitch.HelixRequest(`users/follows?from_id=${user2ID}&to_id=${streamerID}&first=1`, {})).json()));
			// .data)[0]?.followed_at ?? 0;

		// console.log(`U1 = ${user1followage}\nU2 = ${user2followage}`);
		console.log('U1');
		console.log(user1followage);
		console.log('U2');
		console.log(user2followage);

		return;

		if(user1followage == 0)
			return send(`${user1} is not following ${Twitch.Config.channel} :(`);

		if(user2followage == 0)
			return send(`${user2} is not following ${Twitch.Config.channel} :(`);

		const now = Date.now();
		user1followage = now - Date.parse(user1followage);
		user2followage = now - Date.parse(user2followage);
		let beats = '';


		if(user1followage > user2followage)
			beats = user1;
		else if(user2followage > user1followage)
			beats = user2;
		else
			return send(`You both have the same followage at ${humanize(user1followage, { round: true })}`);

		return send(`${beats} follows ${Twitch.Config.channel} longer than ${beats == user1? user2 : user1} does, at ${humanize(Math.abs(user1followage - user2followage), { round: true })}`);
	}
};