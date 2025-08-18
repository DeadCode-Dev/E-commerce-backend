import transporter from "../config/nodeMailer";
import path from "path";
import fs from "fs";

interface OrderDetails {
  orderNumber: string;
  orderDate: string;
  firstName: string;
  products: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
  trackingUrl: string;
  shippingCost: number;
}

class Mailler {
  static renderTemplate(data: Record<string, string>, templateName: string) {
    const templatesPathFile = path.join(__dirname, "../templates");
    const templatePath = path.join(templatesPathFile, `${templateName}.html`);
    let template = fs.readFileSync(templatePath, "utf-8");
    for (const key in data) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      template = template.replace(regex, data[key]);
    }
    // Handle case where no placeholders are found
    const regex = new RegExp("{{\\s*\\w+\\s*}}", "g");
    template = template.replace(regex, "");

    return template;
  }

  static async sendEmail(to: string, subject: string, html: string) {
    // Implementation for sending email
    transporter.sendMail({ to, subject, html }, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent successfully:", info);
      }
    });
  }

  static async resetPassword(to: string, resetLink: string) {
    const subject = "Password reset request";
    const html = this.renderTemplate(
      {
        logoUrl: process.env.logoUrl,
        serviceName: process.env.serviceName,
        expM: "5 Minutes",
        resetLink,
        supportEmail: process.env.supportEmail,
        currentYear: new Date().getFullYear().toString(),
      },
      "resetPassword"
    );
    await this.sendEmail(to, subject, html);
  }

  static async sendOTP(email: string, otp: string) {
    const serviceName = process.env.serviceName;
    const subject = `Your ${serviceName} verification code: ${otp}`;
    const html = this.renderTemplate(
      {
        logoUrl: process.env.logoUrl,
        serviceName: serviceName,
        expM: "5",
        supportEmail: process.env.supportEmail,
        currentYear: new Date().getFullYear().toString(),
        otpCode: otp,
      },
      "sendOTP"
    );
    await this.sendEmail(email, subject, html);
  }

  static async signUp(email: string, name: string, shopUrl: string) {
    const serviceName = process.env.serviceName;
    const subject = `🎉 Welcome to ${serviceName} – Let\`s get shopping!`;
    const html = this.renderTemplate(
      {
        logoUrl: process.env.logoUrl,
        serviceName: serviceName,
        firstName: name,
        shopUrl: shopUrl,
        supportEmail: process.env.supportEmail,
        currentYear: new Date().getFullYear().toString(),
      },
      "signUp"
    );
    await this.sendEmail(email, subject, html);
  }

  static async OrderConfirmation(email: string, orderDetails: OrderDetails) {
    const serviceName = process.env.serviceName;
    const subject = `🛍️ Your Order Confirmation - ${serviceName}`;
    const table = this.renderOrderDetails(orderDetails);
    const html = this.renderTemplate(
      {
        serviceName: serviceName,
        logoUrl: process.env.logoUrl,
        orderNumber: orderDetails.orderNumber,
        orderDate: orderDetails.orderDate,
        firstName: orderDetails.firstName,
        table: table,
        orderTrackingUrl: orderDetails.trackingUrl,
        supportEmail: process.env.supportEmail,
        currentYear: new Date().getFullYear().toString(),
      },
      "orderConfirmation"
    );
    await this.sendEmail(email, subject, html);
  }

  static renderOrderDetails(orderDetails: OrderDetails) {
    let data = ``;
    orderDetails.products.forEach((item) => {
      data += `<tr>
        <td>${item.productName}</td>
        <td>${item.quantity}</td>
        <td>${item.price}</td>
      </tr>`;
    });
    let total = orderDetails.products.reduce((acc, item) => {
      return acc + item.price * item.quantity;
    }, 0);

    total += orderDetails.shippingCost;
    data += `
      <tr>
        <td colspan="2">Shipping Cost</td>
        <td>${orderDetails.shippingCost}</td>
      </tr>
    `;
    data += `
      <tr>
        <td colspan="2">Total</td>
        <td>${total}</td>
      </tr>
    `;
    return data;
  }
}

export default Mailler;
