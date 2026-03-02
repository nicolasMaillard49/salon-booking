import { Injectable, Logger } from '@nestjs/common';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Resend } from 'resend';

type AppointmentMailData = {
  date: Date;
  timeSlot: string;
  firstName: string;
  lastName: string;
  email: string;
  magicToken: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend = new Resend(process.env.RESEND_API_KEY);
  private readonly adminEmail = process.env.ADMIN_EMAIL;
  private readonly frontendUrl = process.env.FRONTEND_URL;
  private readonly fromEmail = 'Nm.D.Barber <noreply@restaurants-bordeaux.com>';

  private formatDate(date: Date): string {
    return format(new Date(date), 'EEEE d MMMM yyyy', { locale: fr });
  }

  private formatDateTime(appointment: AppointmentMailData): string {
    return `${this.formatDate(appointment.date)} à ${appointment.timeSlot}`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private renderEmailShell(params: {
    preheader: string;
    title: string;
    intro: string;
    highlightLabel: string;
    highlightValue: string;
    content: string;
    buttonLabel?: string;
    buttonUrl?: string;
    footerNote: string;
    accent?: string;
  }): string {
    const accent = params.accent ?? '#b68652';
    const button =
      params.buttonLabel && params.buttonUrl
        ? `
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <a href="${params.buttonUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:${accent};color:#111111;text-decoration:none;font-weight:700;">
                ${this.escapeHtml(params.buttonLabel)}
              </a>
            </td>
          </tr>
        `
        : '';

    return `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${this.escapeHtml(params.title)}</title>
        </head>
        <body style="margin:0;padding:24px;background:#f4efe8;font-family:Arial,Helvetica,sans-serif;color:#1b1b1b;">
          <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
            ${this.escapeHtml(params.preheader)}
          </div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;border-collapse:collapse;">
                  <tr>
                    <td style="padding:0 0 16px 0;text-align:center;">
                      <div style="display:inline-block;padding:10px 16px;border-radius:999px;background:#111111;color:#f7f3ee;font-size:12px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;">
                        Nm.D.Barber
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#fffdfa;border:1px solid #e7dccd;border-radius:28px;overflow:hidden;box-shadow:0 10px 30px rgba(43,30,18,0.08);">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                        <tr>
                          <td style="padding:32px 32px 24px 32px;background:linear-gradient(135deg,#111111 0%,#2d241d 100%);color:#ffffff;">
                            <div style="font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${accent};">
                              Confirmation
                            </div>
                            <h1 style="margin:14px 0 10px 0;font-size:30px;line-height:1.2;color:#ffffff;">
                              ${this.escapeHtml(params.title)}
                            </h1>
                            <p style="margin:0;font-size:16px;line-height:1.7;color:#e9dfd3;">
                              ${this.escapeHtml(params.intro)}
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:28px 32px 20px 32px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f8f3ec;border:1px solid #eadfce;border-radius:20px;">
                              <tr>
                                <td style="padding:18px 20px;">
                                  <div style="font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#8f6a41;">
                                    ${this.escapeHtml(params.highlightLabel)}
                                  </div>
                                  <div style="margin-top:8px;font-size:20px;font-weight:700;line-height:1.4;color:#1b1b1b;">
                                    ${this.escapeHtml(params.highlightValue)}
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:0 32px 12px 32px;font-size:15px;line-height:1.8;color:#3e362f;">
                            ${params.content}
                          </td>
                        </tr>
                        ${button}
                        <tr>
                          <td style="padding:0 32px 32px 32px;">
                            <div style="padding-top:18px;border-top:1px solid #eee3d5;font-size:13px;line-height:1.7;color:#7a6d61;">
                              ${this.escapeHtml(params.footerNote)}
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  private renderDetailsTable(rows: Array<[string, string]>): string {
    return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:8px 0 0 0;">
        ${rows
          .map(
            ([label, value]) => `
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eee3d5;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#8a7b6b;">
                  ${this.escapeHtml(label)}
                </td>
                <td style="padding:10px 0;border-bottom:1px solid #eee3d5;font-size:15px;color:#1b1b1b;text-align:right;">
                  ${this.escapeHtml(value)}
                </td>
              </tr>
            `,
          )
          .join('')}
      </table>
    `;
  }

  private renderTextEmail(parts: string[]): string {
    return parts.join('\n\n');
  }

  async sendCreatedToClient(appointment: AppointmentMailData) {
    try {
      const statusUrl = `${this.frontendUrl}/booking/${appointment.magicToken}`;
      const dateTime = this.formatDateTime(appointment);

      await this.resend.emails.send({
        from: this.fromEmail,
        to: appointment.email,
        subject: 'Votre demande de RDV est bien enregistree',
        html: this.renderEmailShell({
          preheader: `Votre demande du ${dateTime} est en attente de confirmation.`,
          title: `Bonjour ${appointment.firstName}, votre demande est recue.`,
          intro:
            'Votre reservation a bien ete prise en compte. Elle reste en attente de validation avant confirmation finale.',
          highlightLabel: 'Rendez-vous demande',
          highlightValue: dateTime,
          content: `
            <p style="margin:0 0 14px 0;">Nous vous envoyons un nouveau message des que le statut evolue.</p>
            <p style="margin:0 0 18px 0;">Vous pouvez suivre votre demande a tout moment depuis votre lien personnel.</p>
            ${this.renderDetailsTable([
              ['Client', `${appointment.firstName} ${appointment.lastName}`],
              ['Email', appointment.email],
              ['Statut', 'En attente de confirmation'],
            ])}
          `,
          buttonLabel: 'Suivre mon rendez-vous',
          buttonUrl: statusUrl,
          footerNote:
            'Si vous n etes pas a l origine de cette demande, vous pouvez simplement ignorer cet email.',
        }),
        text: this.renderTextEmail([
          `Bonjour ${appointment.firstName},`,
          `Votre demande de rendez-vous pour le ${dateTime} a bien ete enregistree.`,
          'Statut : en attente de confirmation.',
          `Suivi : ${statusUrl}`,
          'Nm.D.Barber',
        ]),
      });
    } catch (e) {
      this.logger.warn(`Email client non envoye : ${e.message}`);
    }
  }

  async sendCreatedToAdmin(appointment: AppointmentMailData) {
    try {
      const adminUrl = `${this.frontendUrl}/admin`;
      const dateTime = this.formatDateTime(appointment);

      await this.resend.emails.send({
        from: this.fromEmail,
        to: this.adminEmail,
        subject: `Nouvelle demande RDV - ${appointment.firstName} ${appointment.lastName}`,
        html: this.renderEmailShell({
          preheader: `Nouvelle demande de ${appointment.firstName} ${appointment.lastName} pour le ${dateTime}.`,
          title: 'Nouvelle reservation a valider',
          intro:
            'Une nouvelle demande vient d arriver dans le planning. Vous pouvez la consulter et la traiter depuis l espace admin.',
          highlightLabel: 'Creneau demande',
          highlightValue: dateTime,
          content: `
            <p style="margin:0 0 18px 0;">Resume de la demande recue :</p>
            ${this.renderDetailsTable([
              ['Client', `${appointment.firstName} ${appointment.lastName}`],
              ['Email', appointment.email],
              ['Statut', 'En attente'],
            ])}
          `,
          buttonLabel: 'Ouvrir le panneau admin',
          buttonUrl: adminUrl,
          footerNote: 'Pensez a confirmer ou annuler ce rendez-vous pour notifier automatiquement le client.',
          accent: '#d4a76a',
        }),
        text: this.renderTextEmail([
          'Nouvelle demande de rendez-vous.',
          `Client : ${appointment.firstName} ${appointment.lastName}`,
          `Email : ${appointment.email}`,
          `Creneau : ${dateTime}`,
          `Admin : ${adminUrl}`,
        ]),
      });
    } catch (e) {
      this.logger.warn(`Email admin non envoye : ${e.message}`);
    }
  }

  async sendStatusUpdate(appointment: AppointmentMailData) {
    try {
      const isConfirmed = appointment.status === 'CONFIRMED';
      const statusUrl = `${this.frontendUrl}/booking/${appointment.magicToken}`;
      const dateTime = this.formatDateTime(appointment);
      const statusLabel = isConfirmed ? 'Confirme' : 'Annule';

      await this.resend.emails.send({
        from: this.fromEmail,
        to: appointment.email,
        subject: isConfirmed
          ? `RDV confirme - ${dateTime}`
          : `RDV annule - ${dateTime}`,
        html: this.renderEmailShell({
          preheader: isConfirmed
            ? `Votre rendez-vous du ${dateTime} est confirme.`
            : `Votre rendez-vous du ${dateTime} a ete annule.`,
          title: isConfirmed
            ? 'Votre rendez-vous est confirme'
            : 'Votre rendez-vous a ete annule',
          intro: isConfirmed
            ? 'Votre creneau est reserve. Nous vous attendons au salon a l heure prevue.'
            : 'Ce creneau n est plus maintenu. Vous pouvez reserver une autre date quand vous le souhaitez.',
          highlightLabel: 'Creneau concerne',
          highlightValue: dateTime,
          content: `
            <p style="margin:0 0 18px 0;">
              ${
                isConfirmed
                  ? 'Tout est valide de notre cote. Conservez votre lien de suivi si vous souhaitez reconsulter le rendez-vous.'
                  : 'Le lien de suivi reste accessible si vous souhaitez verifier le statut ou reprendre un rendez-vous.'
              }
            </p>
            ${this.renderDetailsTable([
              ['Client', `${appointment.firstName} ${appointment.lastName}`],
              ['Statut', statusLabel],
            ])}
          `,
          buttonLabel: 'Voir mon rendez-vous',
          buttonUrl: statusUrl,
          footerNote: isConfirmed
            ? 'Merci pour votre confiance. A tres bientot chez Nm.D.Barber.'
            : 'Si besoin, vous pouvez effectuer une nouvelle demande en quelques clics.',
          accent: isConfirmed ? '#c89b5b' : '#d47d61',
        }),
        text: this.renderTextEmail([
          `Bonjour ${appointment.firstName},`,
          isConfirmed
            ? `Votre rendez-vous du ${dateTime} est confirme.`
            : `Votre rendez-vous du ${dateTime} a ete annule.`,
          `Lien de suivi : ${statusUrl}`,
          'Nm.D.Barber',
        ]),
      });
    } catch (e) {
      this.logger.warn(`Email statut non envoye : ${e.message}`);
    }
  }
}
