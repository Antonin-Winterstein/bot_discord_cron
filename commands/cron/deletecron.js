const cronSchema = require("../../models/cronSchema");
const DiscordJS = require("discord.js");

module.exports = {
	name: "deletecron",
	category: "cron",
	description: "Deletes the CRON using its identifier.",
	userPermissions: ["ADMINISTRATOR"],
	usage: "deletecron [identifier]",
	examples: ["deletecron [622ea01f78ef802465cda7d4]"],
	options: [
		{
			name: "id",
			description: "The Id of the CRON.",
			required: true,
			type: DiscordJS.Constants.ApplicationCommandOptionTypes.STRING,
		},
	],
	async runInteraction(Client, interaction) {
		// Récupération des données envoyées par l'utilisateur
		const sentId = interaction.options.getString("id");

		// Si le format de l'ID est respecté
		if (sentId.match(/^[0-9a-fA-F]{24}$/)) {
			// On supprime le CRON pour l'ID envoyé par l'utilisateur sur son serveur
			let deleteOneResults = await cronSchema.deleteOne({
				_id: sentId,
				guildId: interaction.guildId,
			});

			// Si on a effectivement supprimé quelque chose de la BDD, on précise que le CRON a bien été supprimé
			if (deleteOneResults.deletedCount != 0) {
				interaction.reply({
					content: "The CRON has been successfully deleted.",
					ephemeral: true,
				});
			}
			// Si rien n'a été supprimé, cela veut dire que l'ID n'était pas bon et on l'indique à l'utilisateur
			else {
				interaction.reply({
					content: "No CRON found for this Id.",
					ephemeral: true,
				});
			}
		}
		// Si le format de l'ID n'est pas respecté, on l'indique à l'utilisateur
		else {
			interaction.reply({
				content: "No CRON found for this Id.",
				ephemeral: true,
			});
		}
	},
};
