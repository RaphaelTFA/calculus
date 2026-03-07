import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

sender = settings.email_sender
password = settings.email_password


def build_verification_email_html(display_name: str, verify_url: str) -> str:
    return f"""
        <div style=\"font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;\">
            <h2 style=\"margin-bottom: 8px;\">Xac minh tai khoan Calculus</h2>
            <p>Xin chao <strong>{display_name}</strong>,</p>
            <p>Cam on ban da dang ky. Vui long bam nut ben duoi de xac minh email:</p>
            <p style=\"margin: 24px 0;\">
                <a href=\"{verify_url}\"
                     style=\"background:#2563eb;color:white;padding:10px 16px;border-radius:8px;text-decoration:none;\">
                    Xac minh email
                </a>
            </p>
            <p>Neu ban khong tao tai khoan nay, ban co the bo qua email.</p>
        </div>
        """


def send_html_email(receiver: str, subject: str, html: str):
    if not sender or not password:
        raise RuntimeError("Email sender credentials are not configured")

    msg = MIMEMultipart()
    msg["From"] = sender
    msg["To"] = receiver
    msg["Subject"] = subject
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(sender, password)
        server.send_message(msg)

if __name__ == "__main__":
    send_html_email("hungna200111@gmail.com", "Test Email", "<h1>Hello from Calculus API!</h1><p>This is a test email.</p>")