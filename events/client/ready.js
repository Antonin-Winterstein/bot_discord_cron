const { Guild } = require("../../models/index");
const CronJob = require("cron").CronJob;
const Logger = require("../../utils/Logger");

module.exports = {
	name: "ready",
	once: true,
	async execute(Client) {
		// Affiche le nombre de serveurs où le bot est actif avec le total d'utilisateurs
		let guildsCount = await Client.guilds.fetch();
		let usersCount = Client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
		Logger.client(
			`- ready to be used by ${usersCount} users on ${guildsCount.size} servers`
		);

		// Si on redémarre le bot ou qu'il crash tout simplement, on remet la valeur isActive de tous les CRON à false pour qu'ils se remettent par la suite automatiquement à true ce qui permet de lancer les CRON
		await Guild.updateMany(
			{ "crons.isActive": true },
			{ $set: { "crons.$[].isActive": false } },
			{ multi: true }
		);

		// Constantes temporaires pour le développement avec l'ID du serveur
		const guild = await Client.guilds.cache.get("646033280499580948");
		const arrayOfSlashCommands = Client.commands.map((cmd) => cmd);

		guild.commands.set(arrayOfSlashCommands).then((cmd) => {
			// Récupération des rôles pour la commande
			const getRoles = (commandName) => {
				// Récupération des permissions requises pour la commande
				const permissions = arrayOfSlashCommands.find(
					(x) => x.name === commandName
				).userPermissions;

				// Si la commande n'a pas de permission
				if (!permissions) return null;

				// Si la commande a des permissions on récupère les rôles
				return guild.roles.cache.filter(
					(x) => x.permissions.has(permissions) && !x.managed
				);
			};

			// Récupération des permissions pour la commande
			const fullPermissions = cmd.reduce((accumulator, x) => {
				// Récupération des rôles pour la commande
				const roles = getRoles(x.name);

				// S'il n'y a pas de rôles
				if (!roles) return accumulator;

				// Définition de toutes les permissions nécessaires
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

				// On retourne les permissions nécessaires pour la commande
				return [
					...accumulator,
					{
						id: x.id,
						permissions,
					},
				];
			}, []);

			// Met à jour les permissions pour la commande
			guild.commands.permissions.set({ fullPermissions });
		});

		// Fonction qui vérifie si un nouveau CRON a été créé pour l'activer
		const checkForCRON = async () => {
			// Récupérer tous les serveurs de la base de données
			const findResults = await Guild.find();

			// Boucler sur tous les serveurs récupérés
			for (const post of findResults) {
				const guildId = post._id;
				const crons = post.crons;

				const guild = await Client.guilds.fetch(guildId);
				if (!guild) {
					continue;
				}

				// Boucler sur tous les CRON du serveur
				for (const cronData of crons) {
					const { time, message, channelId, isActive, _id } = cronData;

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
						await Guild.updateOne(
							{ _id: guildId, "crons._id": _id },
							{ $set: { "crons.$.isActive": true } }
						);
					}
				}
			}
			// Toutes les 10 secondes, on rappelle cette même fonction pour vérifier si un nouveau CRON a été créé pour ainsi l'activer
			setTimeout(checkForCRON, 1000 * 10);
		};

		// On appelle la fonction qui active les CRON
		checkForCRON();

		// Permet de changer le statut du bot ainsi que son humeur
		Client.user.setPresence({
			activities: [{ name: "every CRON!", type: "LISTENING" }],
			status: "online",
		});
	},
};
