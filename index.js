const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('Valenza Bot 7/24 Aktif!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Web sunucusu ${PORT} portunda dinlemede.`);
});

// --- DISCORD BOT KODLARIN BUNDAN SONRA BAŞLASIN ---
require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ComponentType, 
    PermissionFlagsBits,
    ChannelType 
} = require('discord.js');

const { 
    joinVoiceChannel, 
    VoiceConnectionStatus, 
    entersState 
} = require('@discordjs/voice');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates // Ses kanallarını görebilmek için zorunlu!
    ]
});

// ==================== ID VE ROL AYARLARI ====================
// Roller
const ROL_KAYITSIZ      = "1538196375844556880";
const ROL_ERKEK         = "1536712770173796383";
const ROL_KIZ           = "1536712771024986194";

// Yetkili Rolleri
const ROL_KAYIT_YETKILI = "1538216512014385314"; 
const ROL_BAN_YETKILI   = "1538226218334167060";   
const ROL_KICK_YETKILI  = "1538230673398300753";  
const ROL_MUTE_YETKILI  = "1538226220737634304";  

// Kanallar
const KANAL_HOSGELDIN   = "1538195617925570630"; 
// ============================================================

client.once('ready', async () => {
    console.log(`🤖 ${client.user.tag} tüm komutlarıyla aktif!`);

    // VALENZA ses kanalına otomatik bağlanma ve sağırlaşma
    for (const guild of client.guilds.cache.values()) {
        const sesKanali = guild.channels.cache.find(c => c.name.toLowerCase() === 'valenza' && c.type === ChannelType.GuildVoice);
        
        if (sesKanali) {
            const baglan = () => {
                const connection = joinVoiceChannel({
                    channelId: sesKanali.id,
                    guildId: guild.id,
                    adapterCreator: guild.voiceAdapterCreator,
                    selfDeaf: true // Botu sağırlaştırır (Self-Deaf)
                });

                connection.on(VoiceConnectionStatus.Disconnected, async () => {
                    try {
                        await entersState(connection, VoiceConnectionStatus.Connecting, 5_000);
                    } catch {
                        connection.destroy();
                        setTimeout(baglan, 3_000); // Bağlantı koparsa 3 saniye sonra tekrar bağlan
                    }
                });
            };

            baglan();
            console.log(`🔊 "${guild.name}" sunucusundaki "VALENZA" ses kanalına girildi ve sağırlaştırıldı!`);
        } else {
            console.log(`⚠️ "${guild.name}" sunucusunda "VALENZA" adında bir ses kanalı bulunamadı!`);
        }
    }
});

// 1. Sunucuya Yeni Katılanlara Hoş Geldin Mesajı ve Otomatik Kayıtsız Rolü
client.on('guildMemberAdd', async (member) => {
    try {
        await member.roles.add(ROL_KAYITSIZ);
    } catch (err) {
        console.error("Kayıtsız rolü verilirken hata oluştu:", err);
    }

    try {
        const hosgeldinKanali = member.guild.channels.cache.get(KANAL_HOSGELDIN);
        if (hosgeldinKanali) {
            await hosgeldinKanali.send(`VALENZA sunucusuna hoş geldin ${member}! Seninle beraber toplam **${member.guild.memberCount}** kişi olduk.`);
        }
    } catch (err) {
        console.error("Hoş geldin mesajı atılırken hata oluştu:", err);
    }
});

// 2. Ana Komut Dinleyici
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild || !message.content.startsWith('.v ')) return;

    const args = message.content.slice(3).trim().split(/ +/);
    const komut = args.shift().toLowerCase();

    // --------------------------------------------------
    // 💣 NUKE KOMUTU (.v nuke)
    // --------------------------------------------------
    if (komut === 'nuke') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Bu komutu kullanmak için **Kanalları Yönet** yetkisine sahip olmalısın!');
        }

        try {
            const mevcutKanal = message.channel;
            const pozisyon = mevcutKanal.position;

            const yeniKanal = await mevcutKanal.clone();
            await mevcutKanal.delete();
            await yeniKanal.setPosition(pozisyon);

            await yeniKanal.send(`💥 Kanal ${message.author} tarafından sıfırlandı!`);
        } catch (err) {
            console.error(err);
            message.reply('❌ Kanal sıfırlanırken bir hata oluştu! Botun "Kanalları Yönet" yetkisini kontrol edin.');
        }
    }

    // --------------------------------------------------
    // 👢 KICK KOMUTU (.v kick ID/Etiket Sebep)
    // --------------------------------------------------
    else if (komut === 'kick') {
        if (!message.member.roles.cache.has(ROL_KICK_YETKILI) && !message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return message.reply('❌ Bu komutu kullanmak için **Kick Yetkilisi** rolüne sahip olmalısın!');
        }

        const hedefUye = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
        const sebep = args.slice(1).join(' ') || 'Sebep belirtilmedi.';

        if (!hedefUye) return message.reply('⚠️ Lütfen atılacak üyenin ID\'sini veya etiketini girin!\nÖrn: `.v kick @kullanıcı Kural İhlali`');

        if (!hedefUye.kickable) {
            return message.reply('❌ Bu kullanıcıyı atamıyorum! Yetki sıram yetersiz olabilir veya kullanıcı bir yönetici olabilir.');
        }

        try {
            await hedefUye.kick(sebep);
            message.channel.send(`👢 **${hedefUye.user.tag}** (${hedefUye.id}) sunucudan atıldı.\n**Sebep:** ${sebep}`);
        } catch (err) {
            console.error(err);
            message.reply('❌ Kullanıcı sunucudan atılırken bir hata oluştu.');
        }
    }

    // --------------------------------------------------
    // 📋 KAYIT KOMUTU (.v kayıt @kullanıcı / ID)
    // --------------------------------------------------
    else if (komut === 'kayıt' || komut === 'kayit') {
        if (!message.member.roles.cache.has(ROL_KAYIT_YETKILI) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Bu komutu kullanmak için **Kayıt Yetkilisi** olmalısın!');
        }

        const hedefUye = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
        if (!hedefUye) return message.reply('⚠️ Lütfen kayıt edilecek kişiyi etiketleyin veya ID\'sini yazın!\nÖrn: `.v kayıt @kullanıcı`');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_erkek').setLabel('Erkek (Male)').setEmoji('👨').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('btn_kiz').setLabel('Kız (Female)').setEmoji('👩').setStyle(ButtonStyle.Danger)
        );

        const yanit = await message.channel.send({
            content: `👤 **Kayıt Edilecek Üye:** ${hedefUye}\n❓ Lütfen uygun cinsiyet rolünü seçin:`,
            components: [row]
        });

        const collector = yanit.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({ content: '❌ Bu menüyü sadece komutu çalıştıran yetkili kullanabilir!', ephemeral: true });
            }
            await interaction.deferUpdate();

            if (interaction.customId === 'btn_erkek') {
                await hedefUye.roles.add(ROL_ERKEK);
                await hedefUye.roles.remove(ROL_KAYITSIZ);
                await yanit.edit({ content: `✅ ${hedefUye} başarıyla **Erkek** olarak kaydedildi ve kayıtsız rolü alındı!`, components: [] });
            } else if (interaction.customId === 'btn_kiz') {
                await hedefUye.roles.add(ROL_KIZ);
                await hedefUye.roles.remove(ROL_KAYITSIZ);
                await yanit.edit({ content: `✅ ${hedefUye} başarıyla **Kız** olarak kaydedildi ve kayıtsız rolü alındı!`, components: [] });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                yanit.edit({ content: '⏱️ Kayıt işlemi zaman aşımına uğradı.', components: [] }).catch(() => {});
            }
        });
    }

    // --------------------------------------------------
    // 🔨 BAN KOMUTU (.v ban ID/Etiket Sebep)
    // --------------------------------------------------
    else if (komut === 'ban') {
        if (!message.member.roles.cache.has(ROL_BAN_YETKILI) && !message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply('❌ Bu komutu kullanmak için **Ban Yetkilisi** rolüne sahip olmalısın!');
        }

        const hedefId = message.mentions.users.first()?.id || args[0];
        const sebep = args.slice(1).join(' ') || 'Sebep belirtilmedi.';

        if (!hedefId) return message.reply('⚠️ Lütfen banlanacak kişinin ID\'sini veya etiketini girin!\nÖrn: `.v ban @kullanıcı Kural İhlali`');

        try {
            await message.guild.members.ban(hedefId, { reason: sebep });
            message.channel.send(`🔨 **<@${hedefId}>** (${hedefId}) sunucudan banlandı.\n**Sebep:** ${sebep}`);
        } catch (err) {
            console.error(err);
            message.reply('❌ Kullanıcı banlanamadı! ID\'nin doğruluğunu veya botun yetki sırasını kontrol edin.');
        }
    }

    // --------------------------------------------------
    // 🔓 UNBAN KOMUTU (.v unban ID)
    // --------------------------------------------------
    else if (komut === 'unban') {
        if (!message.member.roles.cache.has(ROL_BAN_YETKILI) && !message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply('❌ Bu komutu kullanmak için **Ban Yetkilisi** rolüne sahip olmalısın!');
        }

        const hedefId = args[0];
        if (!hedefId) return message.reply('⚠️ Lütfen yasağı kaldırılacak kişinin ID\'sini girin!\nÖrn: `.v unban 123456789`');

        try {
            await message.guild.bans.remove(hedefId);
            message.channel.send(`🔓 **<@${hedefId}>** ID\'li kullanıcının ban yasağı kaldırıldı.`);
        } catch (err) {
            console.error(err);
            message.reply('❌ Yasağı kaldırırken bir hata oluştu! Kullanıcı banlı olmayabilir veya ID yanlış olabilir.');
        }
    }

    // --------------------------------------------------
    // 🔇 MUTE KOMUTU (.v mute ID/Etiket Süre)
    // --------------------------------------------------
    else if (komut === 'mute') {
        if (!message.member.roles.cache.has(ROL_MUTE_YETKILI) && !message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ Bu komutu kullanmak için **Mute Yetkilisi** rolüne sahip olmalısın!');
        }

        const hedefUye = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
        if (!hedefUye) return message.reply('⚠️ Lütfen mütelenecek üyenin ID\'sini veya etiketini girin!\nÖrn: `.v mute @kullanıcı 1d`');

        const zamanParam = args[1];
        if (!zamanParam) return message.reply('⚠️ Lütfen bir süre belirtin!\nÖrn: `15m` (dakika), `2h` (saat), `1d` (gün)');

        let sureMs = 0;
        const miktar = parseInt(zamanParam.slice(0, -1));
        const birim = zamanParam.slice(-1).toLowerCase();

        if (isNaN(miktar)) {
            return message.reply('❌ Geçersiz süre formatı! Örnek kullanım: `10m`, `1h`, `1d`.');
        }

        if (birim === 'm') {
            sureMs = miktar * 60 * 1000;
        } else if (birim === 'h') {
            sureMs = miktar * 60 * 60 * 1000;
        } else if (birim === 'd') {
            sureMs = miktar * 24 * 60 * 60 * 1000;
        } else {
            return message.reply('❌ Geçersiz zaman birimi! Sadece `m` (dakika), `h` (saat) veya `d` (gün) kullanabilirsiniz.');
        }

        if (sureMs > 28 * 24 * 60 * 60 * 1000) {
            return message.reply('❌ Discord kuralları gereği bir üye en fazla 28 gün susturulabilir.');
        }

        try {
            await hedefUye.timeout(sureMs, `Yetkili: ${message.author.tag} tarafından susturuldu.`);
            message.channel.send(`🔇 ${hedefUye} üyesi **${miktar}${birim}** süreyle susturuldu.`);
        } catch (err) {
            console.error(err);
            message.reply('❌ Kullanıcı susturulamadı! Yetki sıranızı veya üyenin yetkilerini kontrol edin.');
        }
    }

    // --------------------------------------------------
    // 🔊 UNMUTE KOMUTU (.v unmute ID/Etiket)
    // --------------------------------------------------
    else if (komut === 'unmute') {
        if (!message.member.roles.cache.has(ROL_MUTE_YETKILI) && !message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ Bu komutu kullanmak için **Mute Yetkilisi** rolüne sahip olmalısın!');
        }

        const hedefUye = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
        if (!hedefUye) return message.reply('⚠️ Lütfen susturması kaldırılacak üyenin ID\'sini veya etiketini girin!\nÖrn: `.v unmute 123456789`');

        try {
            await hedefUye.timeout(null);
            message.channel.send(`🔊 ${hedefUye} üyesinin susturması kaldırıldı.`);
        } catch (err) {
            console.error(err);
            message.reply('❌ Kullanıcının susturması kaldırılırken bir hata oluştu.');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);