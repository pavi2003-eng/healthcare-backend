const nodemailer = require("nodemailer");

// ✅ Gmail SMTP using Port 587 (TLS)
// This fixes ETIMEDOUT error (port 465 issue)

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // false for 587, true for 465
  auth: {
    user: "paviv592003@gmail.com",     // Your Gmail
    pass: "yjojlhofeyqubukb"            // Your 16-digit App Password (NO spaces)
  },
  tls: {
    rejectUnauthorized: false
  }
});

// ✅ Send Appointment Accepted Email
const sendAppointmentAcceptedEmail = async (
  patientEmail,
  patientName,
  doctorName,
  appointmentDate,
  appointmentTime
) => {
  const mailOptions = {
    from: `"Healthcare Portal" <paviv592003@gmail.com>`,
    to: patientEmail,
    subject: "Your Appointment Has Been Accepted ✅",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #2c3e50;">Appointment Accepted</h2>
        
        <p>Dear <strong>${patientName}</strong>,</p>

        <p>
          Your appointment with 
          <strong>Dr. ${doctorName}</strong>
          has been successfully accepted.
        </p>

        <table style="border-collapse: collapse; margin-top: 15px;">
          <tr>
            <td style="padding: 8px; font-weight: bold;">Date:</td>
            <td style="padding: 8px;">
              ${new Date(appointmentDate).toLocaleDateString()}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Time:</td>
            <td style="padding: 8px;">${appointmentTime}</td>
          </tr>
        </table>

        <p style="margin-top: 20px;">
          Please log in to the patient portal for more details.
        </p>

        <p>Thank you,<br/>Healthcare Team</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.response);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};

module.exports = { sendAppointmentAcceptedEmail };
