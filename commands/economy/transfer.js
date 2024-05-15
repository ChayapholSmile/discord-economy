const { Client, Interaction, ApplicationCommandOptionType, MessageEmbed } = require('discord.js');
const User = require('../../models/User');
const Canvacord = require('canvacord');

module.exports = {
  name: 'transfer',
  description: 'โอนเงินให้กับผู้ใช้คนอื่น',
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    if (!interaction.inGuild()) {
      interaction.reply({
        content: 'คุณสามารถใช้คำสั่งนี้ได้เฉพาะในเซิร์ฟเวอร์เท่านั้น',
        ephemeral: true,
      });
      return;
    }

    const targetUserId = interaction.options.getUser('target')?.id;
    const amount = interaction.options.getInteger('amount');

    if (!targetUserId || !amount || amount <= 0) {
      interaction.reply({
        content: 'โปรดระบุผู้ใช้ที่ต้องการโอนและจำนวนเงินที่ถูกต้อง',
        ephemeral: true,
      });
      return;
    }

    if (targetUserId === interaction.user.id) {
      interaction.reply({
        content: 'คุณไม่สามารถโอนเงินให้ตัวเองได้',
        ephemeral: true,
      });
      return;
    }

    const user = await User.findOne({ userId: interaction.user.id, guildId: interaction.guild.id });
    const targetUser = await User.findOne({ userId: targetUserId, guildId: interaction.guild.id });

    if (!user || user.balance < amount) {
      interaction.reply({
        content: 'คุณมีเงินไม่เพียงพอที่จะโอน',
        ephemeral: true,
      });
      return;
    }

    user.balance -= amount;
    targetUser.balance += amount;

    await Promise.all([user.save(), targetUser.save()]);

    // สร้างสลิปโดยใช้ Canvacord
    const canvas = new Canvacord();
    const image = await canvas.transfer({
      sender: interaction.user.username,
      receiver: targetUser.username,
      amount: amount.toString(),
      font: '50px Itim', // ใช้ฟอนต์ Itim ขนาด 50px
    });

    // ส่งสลิปให้ผู้รับ
    await interaction.user.send({ files: [image] });

    // ส่ง DM ไปยังผู้รับ
    await targetUser.send(`เงินเข้า: จาก: ${interaction.user.username} จำนวน: ${amount} บาท`, { files: [image] });

    // ส่ง DM ไปยังผู้ส่ง
    await interaction.user.send(`เงินออก: จำนวน: ${amount} ไปยัง ${targetUser.username}`, { files: [image] });

    interaction.reply({
      content: `โอนเงิน ${amount} ให้ <@${targetUserId}> สำเร็จแล้ว`,
      ephemeral: true,
    });
  },

  options: [
    {
      name: 'target',
      description: 'ผู้ใช้ที่คุณต้องการโอนเงินให้',
      type: ApplicationCommandOptionType.USER,
      required: true,
    },
    {
      name: 'amount',
      description: 'จำนวนเงินที่คุณต้องการโอน',
      type: ApplicationCommandOptionType.INTEGER,
      required: true,
    },
  ],
};
