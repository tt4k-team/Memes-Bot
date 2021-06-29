const schema = require('../../models/prefix');
const Discord = require("discord.js")
module.exports = {

  async execute(client, message, args) {
    if (!message.guild.me.permissionsIn(message.channel).has("EMBED_LINKS")) {
      return message.channel.send("لا املك الصلاحيات الكافية")
    }
    if (!message.member.hasPermission('ADMINISTRATOR'))
      return message.channel.send(
        `**لا تملك الصلاحيات الكافية`
      );
    const prefix = args.join(" ");
    let data = await schema.findOne({ id: message.guild.id });
  if (!prefix) {
return message.channel.send('**من فضلك اختر بادئة**');
} else if(prefix===client.config.prefix && !data){
return message.channel.send('**البرفكس الذي إخترته \`-\` هو البرفكس الإفتراضي للبوت**');
}else if(prefix===client.config.prefix && data){
  await schema.deleteMany({ id: message.guild.id });
return message.channel.send("**تم إعادة تعيين البرفكس للقيمة الإفتراضية `-`**");
}
    try {
      if (!data) {
        let newData = await schema.create({
          id: message.guild.id,
          Prefix: prefix,
        })
        await newData.save()
      } else if(prefix===data.Prefix){
return message.channel.send(`**البرفكس الذي إخترته \`${prefix}\` هو البرفكس الحالي للبوت**`);
} else{
        await schema.deleteMany({ id: message.guild.id });
        let newData = await schema.create({
          id: message.guild.id,
          Prefix: prefix,
        })
        await newData.save()
      }
      let embed = new Discord.MessageEmbed()
        .setDescription(`**تم تعيين \`${prefix}\` كبرفكس البوت الجديد**`)
      message.channel.send(embed);
    } catch (err) { console.error(err) }

  },
};
module.exports.help = {
  name: 'setprefix',
  category: 'public',
  description: "لتغيير البرفكس الخاص بسيرفرك",
  cooldown: 60
}
