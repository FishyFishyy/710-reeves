import BotInteraction from '../../types/BotInteraction';
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, User } from 'discord.js';

export default class SetTrialMember extends BotInteraction {
    get name() {
        return 'set-trial-member';
    }

    get description() {
        return 'Overrides and sets a specific role on a Trial Card (i.e. Reservations, Tryouts, Fillers)';
    }

    get permissions() {
        return 'TRIAL_HOST';
    }

    get roleOptions() {
        const assignOptions: any = {
            'Base': 'Base',
            'Umbra': 'Umbra',
            'Glacies': 'Glacies',
            'Cruor': 'Cruor',
            'Fumus': 'Fumus',
            'Hammer': 'Hammer',
            'Free': 'Free',
        }
        const options: any = [];
        Object.keys(assignOptions).forEach((key: string) => {
            options.push({ name: key, value: assignOptions[key] })
        })
        return options;
    }

    get memberTypeOptions() {
        const assignOptions: any = {
            'Default': 'Default',
            'Tryout': 'Tryout',
            'Filler': 'Filler',
        }
        const options: any = [];
        Object.keys(assignOptions).forEach((key: string) => {
            options.push({ name: key, value: assignOptions[key] })
        })
        return options;
    }

    get slashData() {
        return new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(this.description)
            .addStringOption((option) => option.setName('message_id').setDescription('Trial Card message ID').setRequired(true))
            .addUserOption((option) => option.setName('user').setDescription('Trial Member').setRequired(true))
            .addStringOption((option) => option.setName('role').setDescription('Member Role').addChoices(
                ...this.roleOptions
            ).setRequired(true))
            .addStringOption((option) => option.setName('filler_type').setDescription('Filler Type').addChoices(
                ...this.memberTypeOptions
            ).setRequired(true));
    }

    async run(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });
        const role: string = interaction.options.getString('role', true);
        const user: User = interaction.options.getUser('user', true);
        const fillerType: string = interaction.options.getString('filler_type', true);
        const messageId: string = interaction.options.getString('message_id', true);

        const { colours } = this.client.util;

        const message = await interaction.channel?.messages.fetch(messageId);

        const errorEmbed = new EmbedBuilder()
            .setTitle('Something went wrong!')
            .setColor(colours.discord.red)
            .setDescription('Message with given ID could not be found.');

        if (!message || !message.embeds[0]) {
            return await interaction.editReply({ embeds: [errorEmbed] });
        }

        if (message.embeds[0].description?.includes('started')) {
            errorEmbed.setDescription('This trial has already started.')
            return await interaction.editReply({ embeds: [errorEmbed] });
        }

        // Errors passed, now assign to the correct role as override.
        // Clone the embed completely

        const newEmbed = new EmbedBuilder()
            .setColor(message.embeds[0].color)
            .setDescription(message.embeds[0].description);

        const currentFields = message.embeds[0].fields;

        currentFields.forEach(field => {
            if (field.name.includes(role)) {
                if (fillerType !== 'Default'){
                    field.value = `<@${user.id}> (${fillerType})`;
                } else {
                    field.value = `<@${user.id}>`;
                }
            }
        })

        newEmbed.setFields(currentFields);

        await message.edit({embeds: [newEmbed]});

        const replyEmbed = new EmbedBuilder()
            .setTitle('Member successfully assigned!')
            .setColor(colours.discord.green)
            .setDescription(`<@${user.id}> successfully assigned to **${role}**${fillerType !== 'Default' ? ` as **${fillerType}**` : ''}.`);
        await interaction.editReply({ embeds: [replyEmbed] });
    }
}