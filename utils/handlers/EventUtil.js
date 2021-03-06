const { promisify } = require("util");
const { glob } = require("glob");
const pGlob = promisify(glob);
const Logger = require("../Logger");

module.exports = async (Client) => {
	// Permet d'itérer sur autant de fichiers en ".js" trouvés dans le répertoire des "events" (cwd = current working directory, donne le chemin absolu) grâce à l'utilisation de "glob" qui le permet simplement. Cela retourne la méthode sous forme de promesse grâce à "promisify"
	(await pGlob(`${process.cwd()}/events/*/*.js`)).map(async (eventFile) => {
		const event = require(eventFile);

		// Message d'erreur s'il manque le nom
		if (!event.name)
			return Logger.warn(
				`Event not triggered:  nameless, add a name to your command ↓\nFile -> ${eventFile}`
			);

		// Message d'erreur s'il y a une erreur d'écriture de l'événement
		if (!eventList.includes(event.name)) {
			return Logger.typo(
				`Event not triggered: typography error ↓\nFile -> ${eventFile}`
			);
		}

		// Chargement de l'événement trouvé
		if (event.once) {
			Client.once(event.name, (...args) => event.execute(Client, ...args));
		} else {
			Client.on(event.name, (...args) => event.execute(Client, ...args));
		}

		Logger.event(`- ${event.name}`);
	});
};

// La liste de tous les événements possibles sur Discord.js
const eventList = [
	"apiRequest",
	"apiResponse",
	"applicationCommandCreate",
	"applicationCommandDelete",
	"applicationCommandUpdate",
	"channelCreate",
	"channelDelete",
	"channelPinsUpdate",
	"channelUpdate",
	"debug",
	"emojiCreate",
	"emojiDelete",
	"emojiUpdate",
	"error",
	"guildBanAdd",
	"guildBanRemove",
	"guildCreate",
	"guildDelete",
	"guildIntegrationsUpdate",
	"guildMemberAdd",
	"guildMemberAvailable",
	"guildMemberRemove",
	"guildMembersChunk",
	"guildMemberUpdate",
	"guildScheduledEventCreate",
	"guildScheduledEventDelete",
	"guildScheduledEventUpdate",
	"guildScheduledEventUserAdd",
	"guildScheduledEventUserRemove",
	"guildUnavailable",
	"guildUpdate",
	"interaction",
	"interactionCreate",
	"invalidated",
	"invalidRequestWarning",
	"inviteCreate",
	"inviteDelete",
	"message",
	"messageCreate",
	"messageDelete",
	"messageDeleteBulk",
	"messageReactionAdd",
	"messageReactionRemove",
	"messageReactionRemoveAll",
	"messageReactionRemoveEmoji",
	"messageUpdate",
	"presenceUpdate",
	"rateLimit",
	"ready",
	"roleCreate",
	"roleDelete",
	"roleUpdate",
	"shardDisconnect",
	"shardError",
	"shardReady",
	"shardReconnecting",
	"shardResume",
	"stageInstanceCreate",
	"stageInstanceDelete",
	"stageInstanceUpdate",
	"stickerCreate",
	"stickerDelete",
	"stickerUpdate",
	"threadCreate",
	"threadDelete",
	"threadListSync",
	"threadMembersUpdate",
	"threadMemberUpdate",
	"threadUpdate",
	"typingStart",
	"userUpdate",
	"voiceStateUpdate",
	"warn",
	"webhookUpdate",
];
