import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

@Injectable()
export class MailService {
  private resend = new Resend(process.env.RESEND_API_KEY);
  private adminEmail = process.env.ADMIN_EMAIL;
  private frontendUrl = process.env.FRONTEND_URL;
  private fromEmail = 'Mon Salon <onboarding@resend.dev>';

  private formatDate(date: Date): string {
    return format(new Date(date), 'EEEE d MMMM yyyy', { locale: fr });
  }

  async sendCreatedToClient(appointment: any) {
    const statusUrl = `${this.frontendUrl}/booking/${appointment.magicToken}`;
    await this.resend.emails.send({
      from: this.fromEmail,
      to: appointment.email,
      subject: '✂️ Votre demande de RDV est enregistrée',
      html: `
        <h2>Bonjour ${appointment.firstName} !</h2>
        <p>Votre demande de rendez-vous pour le <strong>${this.formatDate(appointment.date)}</strong> a bien été reçue.</p>
        <p>Elle est actuellement <strong>en attente de confirmation</strong>.</p>
        <p>Vous recevrez un email dès que votre rendez-vous sera confirmé ou annulé.</p>
        <p><a href="${statusUrl}">👉 Suivre mon rendez-vous</a></p>
        <hr/>
        <small>Mon Salon de Coiffure</small>
      `,
    });
  }

  async sendCreatedToAdmin(appointment: any) {
    const adminUrl = `${this.frontendUrl}/admin`;
    await this.resend.emails.send({
      from: this.fromEmail,
      to: this.adminEmail,
      subject: `📅 Nouvelle demande : ${appointment.firstName} ${appointment.lastName}`,
      html: `
        <h2>Nouvelle demande de RDV</h2>
        <p><strong>Client :</strong> ${appointment.firstName} ${appointment.lastName}</p>
        <p><strong>Email :</strong> ${appointment.email}</p>
        <p><strong>Date souhaitée :</strong> ${this.formatDate(appointment.date)}</p>
        <p><a href="${adminUrl}">👉 Gérer depuis le panneau admin</a></p>
      `,
    });
  }

  async sendStatusUpdate(appointment: any) {
    const isConfirmed = appointment.status === 'CONFIRMED';
    const statusUrl = `${this.frontendUrl}/booking/${appointment.magicToken}`;

    await this.resend.emails.send({
      from: this.fromEmail,
      to: appointment.email,
      subject: isConfirmed
        ? `✅ Votre RDV du ${this.formatDate(appointment.date)} est confirmé !`
        : `❌ Votre RDV du ${this.formatDate(appointment.date)} a été annulé`,
      html: `
        <h2>Bonjour ${appointment.firstName} !</h2>
        ${isConfirmed
          ? `<p>Votre rendez-vous du <strong>${this.formatDate(appointment.date)}</strong> est <strong>confirmé</strong>. À bientôt ! ✂️</p>`
          : `<p>Votre rendez-vous du <strong>${this.formatDate(appointment.date)}</strong> a malheureusement été <strong>annulé</strong>.</p><p>N'hésitez pas à réserver une autre date.</p>`
        }
        <p><a href="${statusUrl}">👉 Voir mon rendez-vous</a></p>
        <hr/>
        <small>Mon Salon de Coiffure</small>
      `,
    });
  }
}
