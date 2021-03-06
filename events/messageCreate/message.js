const Discord = require('discord.js');
const cooldowns = new Map();
const db = require("quick.db");
const ms = require("ms");
const chalk = require("chalk")
const i18n = require("i18n");

const Blacklistdata = require("../../models/blacklist");


module.exports = async (client, message, discord) => {
  if (message.author.bot) return;
  if (!message.channel.guild) return;
  let mention = `<@!${client.user.id}>`
  const Config = client.guildsConfig.get(message.guild.id)

  var prefix = message.content.startsWith(mention) ? mention : Config ?.prefix || client.config.prefix
  if (message.content.indexOf(prefix) !== 0) return;

  const dev = client.config.devs.includes(message.author.id)
  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const cmd = args.shift().toLowerCase()
  const command = client.commands.get(cmd) || client.commands.find(a => a.help.aliases && !a.help.aliases.includes("") && a.help.aliases.includes(cmd))
  if (!command) return;


  if (!message.guild.me.permissionsIn(message.channel).has(Discord.Permissions.FLAGS["SEND_MESSAGES"]) || !message.guild.me.permissionsIn(message.channel).has(Discord.Permissions.FLAGS["READ_MESSAGE_HISTORY"])) {
    try {
      return await message.react("❌")
    } catch(err) {
      return
    }
  }
  i18n.setLocale(Config.language)
  let ldata = await Blacklistdata.findOne({ _id: message.author.id })


  if (ldata) {
    if (message.guild.me.permissionsIn(message.channel).has(Discord.Permissions.FLAGS["EMBED_LINKS"])) {
      message.reply({ embeds: [{ description: i18n.__("messageCreate.blacklist_embed") }] })
      return;

    } else {
      message.reply(i18n.__("messageCreate.blacklist"))
      return;
    }
  }

  let memberPermissions = Array.isArray(command ?.help.permissions) ? command ?.help.permissions.filter(perm => Object.keys(Discord.Permissions.FLAGS).includes(perm)) : []
  let botpermissions = Array.isArray(command ?.help.botpermissions) ? command ?.help.botpermissions.filter(perm => Object.keys(Discord.Permissions.FLAGS).includes(perm)) : [];

  for (const memberpermission of memberPermissions) {

    if (message.member.permissions.has(Discord.Permissions.FLAGS[memberpermission])) {
      continue;
    } else {
      return message.reply(i18n.__("messageCreate.permissions", { name: command.help.name, permission: memberpermission }))
    }
  }

  for (const permission of botpermissions) {
    if (message.guild.me.permissionsIn(message.channel).has(Discord.Permissions.FLAGS[permission])) {
      continue;
    } else {
      return message.reply(i18n.__("messageCreate.botpermissions", { permission, channel: message.channel.name, command: command.help.name }))
    }
  }




  const voted = await client.topgg.isVoted(message.author.id)





  if (command.help.test && !dev) {
    if (message.guild.me.permissionsIn(message.channel).has(Discord.Permissions.FLAGS["EMBED_LINKS"])) {
      message.reply({ embeds: [{ description: i18n.__("messageCreate.test") }] })
      return;

    } else {
      message.reply(i18n.__("messageCreate.test"))
      return;
    }
    return;
  }
  if (command.help.category == "devs" && !dev) {
    return;
  }
  console.log(chalk`{green.bold ${message.author.tag}} has used {red.bold ${command.help.name}} in {blue.bold ${message.guild.name}}`)

  let embed = new Discord.MessageEmbed()
    .setAuthor(message.author.tag, message.author.displayAvatarURL({ format: 'png', dynamic: true }))
    .setDescription(`${message.author.tag} has used ${command.help.name} in ${message.guild.name}`)
    .setTimestamp()
  client.logs.send({ embeds: [embed] })





  if (db.get("devonly") && !dev) {
    if (message.guild.me.permissionsIn(message.channel).has(Discord.Permissions.FLAGS["EMBED_LINKS"])) {
      message.reply({ embeds: [{ description: i18n.__("messageCreate.devonly") }] })
      return;

    } else {
      message.reply(i18n.__("messageCreate.devonly"))
      return;
    }
    return;
  }


  if (!cooldowns.has(command.help.name)) {
    const coll = new Discord.Collection()
    cooldowns.set(command.help.name, coll)
  }
  const current_time = Date.now();
  const time_stamps = cooldowns.get(command.help.name);
  var cooldown_amount = isNaN(command.help.cooldown) ? ms(command.help.cooldown || "1s") : command.help.cooldown * 1000

  if (time_stamps.has(message.author.id) && !dev) {
    const expiration_time = time_stamps.get(message.author.id) + cooldown_amount;
    if (current_time < expiration_time) {

      const time_left = ms(expiration_time - current_time)
      let msg = await message.reply(i18n.__("messageCreate.cooldown", { time: time_left }))


      setTimeout(() => msg.delete()
        , cooldown_amount);

      return;

    }
  }

  time_stamps.set(message.author.id, current_time)
  setTimeout(() => { time_stamps.delete(message.author.id) }, cooldown_amount);




  try {
    message.channel.sendTyping()
    await command.execute(client, message, args, Config.language);

  } catch (e) {
    console.log(e);
    let err = new Discord.MessageEmbed()
      .setAuthor(message.author.tag, message.author.displayAvatarURL({ dynamic: true, format: "png" }))
      .setTitle(`**Error in __${command.help.name}__ :x: **`)
      .setDescription(`**Error Stack:** \n\`\`\`js\n${e.stack}\`\`\`\n\n**Error Message:** \n\`\`\`js\n${e.message}\`\`\``)
      .setTimestamp(Date.now())
      .addField("**Permissions :**", message.guild.me.permissionsIn(message.channel).toArray().sort().map(per => `\`${per}\``).join(" "))
      .addField("**Info :**", `Guild :\`${message.guild.name}\`, Channel :\`${message.channel.name}\``)

    client.logs.send({ content: "<@760952710383665192>", embeds: [err] })
    await message.reply(i18n.__("messageCreate.error"));
  }
}

