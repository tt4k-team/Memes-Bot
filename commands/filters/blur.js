const DIG = require("discord-image-generation");
const Discord = require('discord.js');
module.exports = {
  async execute(client, message, args) {
    let user = message.mentions.members.first() || message.member

    let avatar = await user.user.displayAvatarURL({ format: "png", size: 2048, dynamic: true });
    let photo = message.attachments.first() ?.contentType.startsWith("image") ? message.attachments.first() ?.proxyURL : null
    var image = photo || avatar;
    var { data, type } = await client.gif(image, new DIG.Blur().getImage);

    let attach = new Discord.MessageAttachment(data, `blur.${type}`);
    await message.reply({ files: [attach] });

  },
};
module.exports.help = {
  name: 'blur',
  aliases: ["تغبيش"],
  category: 'filters',
  usage: "[level] or [user] [level]",
  botpermissions: ["ATTACH_FILES"],
  cooldown: 1,
}
