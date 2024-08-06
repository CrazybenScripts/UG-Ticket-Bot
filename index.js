const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, ChannelType } = require('discord.js');
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });

const TOKEN = process.env.DISCORD_TOKEN;
const seniorAdminRoleId = '1252031868723794011';
const cooldowns = new Set();

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.content === '-setup') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('You do not have permission to use this command.');
        }

        const embed = new EmbedBuilder()
            .setTitle("UG Verification")
            .setDescription("Welcome to The UNDERGROUND Discord Server! If you create a ticket, we are prepared to answer questions to give us an idea of who you are. To create a ticket, click 🎟️");

        const button = new ButtonBuilder()
            .setCustomId('create_ticket')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎟️');

        const row = new ActionRowBuilder().addComponents(button);

        await message.channel.send({ embeds: [embed], components: [row] });
    }

    if (message.content === '-commands') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('You do not have permission to use this command.');
        }

        return message.reply(`\`-close\` (Disables the permission from the ticket creator to send messages.)
\`-delete\` (Deletes a ticket)
\`-reopen\` (Reopens a ticket if closed)`);
    }

    if (message.channel.name && message.channel.name.startsWith('ticket-')) {
        if (message.content === '-close' && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            const ticketOwner = message.channel.topic;
            if (!ticketOwner) return message.reply('Cannot find the ticket owner.');

            const member = message.guild.members.cache.get(ticketOwner);
            if (member) {
                await message.channel.permissionOverwrites.edit(member, { SendMessages: false });
                message.channel.send('The ticket has been closed.');
            }
        }

        if (message.content === '-delete' && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            message.channel.send('The ticket will be deleted in 5 seconds.')
                .then(() => {
                    setTimeout(() => message.channel.delete(), 5000);
                });
        }

        if (message.content === '-reopen' && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            const ticketOwner = message.channel.topic;
            if (!ticketOwner) return message.reply('Cannot find the ticket owner.');

            const member = message.guild.members.cache.get(ticketOwner);
            if (member) {
                await message.channel.permissionOverwrites.edit(member, { SendMessages: true });
                message.channel.send('The ticket has been reopened.');
            }
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    if (interaction.customId === 'create_ticket') {
        const userId = interaction.user.id;

        if (cooldowns.has(userId)) {
            return interaction.reply({ content: 'You need to wait 1 minute before creating another ticket.', ephemeral: true });
        }

        const categoryID = '1269830700887052312';
        const guild = interaction.guild;
        const member = interaction.member;

        if (!guild || !member) return interaction.reply({ content: 'Error finding guild or member.', ephemeral: true });

        const seniorAdminRole = guild.roles.cache.get(seniorAdminRoleId);
        if (!seniorAdminRole) return interaction.reply({ content: 'Senior admin role not found.', ephemeral: true });

        const ticketChannel = await guild.channels.create({
            name: `ticket-${member.user.username}`,
            type: ChannelType.GuildText,
            parent: categoryID,
            topic: userId,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: member.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                },
                {
                    id: seniorAdminRole.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                }
            ]
        });

        await ticketChannel.send(`<@&${seniorAdminRoleId}> <@${member.id}> A server-mod will be with you shortly. Please share the following requirements:\n\n- Your ROBLOX username (No display)\n- All clans you are currently in and previous clans.\n- Your level in BLACKOUT\n- Your skill level (1-10)`);

        interaction.reply({ content: `Ticket created: ${ticketChannel}`, ephemeral: true });

        cooldowns.add(userId);
        setTimeout(() => cooldowns.delete(userId), 60000);
    }
});

client.login(TOKEN);

// Express server setup for uptime monitoring
app.get("/", (req, res) => {
  res.send("Bot is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Keep-alive code
const URL = process.env.PROJECT_URL;
let count = 0;
setInterval(() => {
  axios.get(URL).then(() => console.log(`[${++count}] Pinged ${URL}`));
}, 300000); // 300000 ms = 5 minutes
