const cronSchema = require("../../models/cronSchema");
const CronJob = require("cron").CronJob;

module.exports = {
	name: "ready",
	once: true,
	async execute(Client) {
		console.log("Bot ready");

		// Si on redémarre le bot ou qu'il crash tout simplement, on remet la valeur isActive de tous les CRON à false pour qu'ils se remettent par la suite automatiquement à true ce qui permet de lancer les CRON
		cronSchema.updateMany(
			{ isActive: true },
			{ $set: { isActive: false } },
			function (err, result) {
				if (err) {
					console.log("Error updating object: " + err);
				} else {
					// console.log("" + result + " document(s) updated");
				}
			}
		);

		// Constantes temporaires pour le développement avec l'ID du serveur
		const guild = await Client.guilds.cache.get("646033280499580948");
		let test = Client.commands.map((cmd) => cmd);

		guild.commands.set(test).then((cmd) => {
			const getRoles = (commandName) => {
				const permissions = test.find(
					(x) => x.name === commandName
				).userPermissions;

				if (!permissions) return null;
				return guild.roles.cache.filter(
					(x) => x.permissions.has(permissions) && !x.managed
				);
			};

			const fullPermissions = cmd.reduce((accumulator, x) => {
				const roles = getRoles(x.name);
				if (!roles) return accumulator;

				const permissions = roles.reduce((a, v) => {
					return [
						...a,
						{
							id: v.id,
							type: "ROLE",
							permission: true,
						},
					];
				}, []);

				return [
					...accumulator,
					{
						id: x.id,
						permissions,
					},
				];
			}, []);

			guild.commands.permissions.set({ fullPermissions });
		});

		const checkForCRON = async () => {
			// Récupérer tous les CRON de la base de données
			const findResults = await cronSchema.find();

			// Boucler sur tous les CRON récupérés
			for (const post of findResults) {
				const { _id, time, message, guildId, channelId, isActive } = post;

				const guild = await Client.guilds.fetch(guildId);
				if (!guild) {
					continue;
				}

				const channel = guild.channels.cache.get(channelId);
				if (!channel) {
					continue;
				}

				// Récupérer les minutes et heures
				let hours = time.split(":")[0];
				let minutes = time.split(":")[1];

				// Si le CRON n'est pas actif, on l'active
				if (isActive == false) {
					new CronJob(
						`1 ${minutes} ${hours} * * *`,
						function () {
							channel.send(message);
						},
						null,
						true,
						"Europe/Paris"
					);

					// On actualise le statut du CRON en actif
					cronSchema.updateOne(
						{ _id: _id },
						{ $set: { isActive: true } },
						function (err, result) {
							if (err) {
								console.log("Error updating object: " + err);
							} else {
								// console.log("" + result + " document(s) updated");
							}
						}
					);
				}
			}
			// Toutes les 10 secondes, on rappelle cette même fonction pour vérifier si un nouveau CRON a été créé pour ainsi l'activer
			setTimeout(checkForCRON, 1000 * 10);
		};

		// On appelle la fonction qui active les CRON
		checkForCRON();
	},
};
