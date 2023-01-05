import BotInteraction from '../../types/BotInteraction';
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Trial } from '../../entity/Trial';
import { TrialParticipation } from '../../entity/TrialParticipation';

export default class TrialLeaderboard extends BotInteraction {
    get name() {
        return 'trial-leaderboard';
    }

    get description() {
        return 'Trial Team Leaderboards';
    }

    get permissions() {
        return 'TRIAL_TEAM';
    }

    get slashData() {
        return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
    }

    public createFieldFromArray = (array: any[]) => {
        const { gem1, gem2, gem3 } = this.client.util.emojis;
        let field = '';
        if (array.length === 0) return 'None';
        array.forEach((item, index) => {
            let prefix: string;
            switch(index){
                case 0:
                    prefix = gem1;
                    break;
                case 1:
                    prefix = gem2
                    break;
                case 2:
                    prefix = gem3
                    break;
                default:
                    prefix = '⬥'
                    break;
            }
            field += `${prefix} <@${item.user}> - **${item.count}**\n`
        })
        return field;
    }

    async run(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: false });
        const { dataSource } = this.client;
        const { colours, roles } = this.client.util;

        // Get top 10 Trials hosted members
        const trialsHosted = await dataSource.createQueryBuilder()
            .select('trial.host', 'user')
            .addSelect('COUNT(*)', 'count')
            .from(Trial, 'trial')
            .groupBy('trial.host')
            .orderBy('count', 'DESC')
            .take(10)
            .getRawMany();

        // Get top 10 Trials participated members
        const trialsParticipated = await dataSource.createQueryBuilder()
            .select('trialParticipation.participant', 'user')
            .addSelect('COUNT(*)', 'count')
            .from(TrialParticipation, 'trialParticipation')
            .groupBy('trialParticipation.participant')
            .orderBy('count', 'DESC')
            .take(10)
            .getRawMany();

        // Get total trials without making another database call
        let totalTrials = 0;
        trialsHosted.forEach(trial => {
            totalTrials += trial.count;
        })

        const embed = new EmbedBuilder()
            .setTimestamp()
            .setTitle('Trial Team Leaderboard')
            .setColor(colours.gold)
            .setDescription(`> There has been **${totalTrials}** trial${totalTrials !== 1 ? 's' : ''} recorded and **${trialsParticipated.length}** unique ${roles.trialTeam} members!`)
            .addFields(
                { name: 'Trials Hosted', value: this.createFieldFromArray(trialsHosted), inline: true },
                { name: 'Trials Participated', value: this.createFieldFromArray(trialsParticipated), inline: true }
            )

        await interaction.editReply({ embeds: [embed] });
    }
}
