import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

sender = settings.email_sender
password = settings.email_password


def build_verification_email_html(display_name: str, verify_url: str) -> str:
    return f"""
    <div style="font-family: Arial, Helvetica, sans-serif; background:#f3f4f6; padding:40px 0;">
        <div style="max-width:520px; margin:auto; background:white; border-radius:12px; padding:32px; box-shadow:0 4px 16px rgba(0,0,0,0.05);">

            <h2 style="margin-top:0; color:#111827;">
            Verify Calculus Account
            </h2>

            <p style="color:#374151;">
            Hello <strong>{display_name}</strong>,
            </p>

            <p style="color:#374151;">
            Thank you for signing up for <strong>Calculus</strong>.  
            Please click the button below to verify your email address.
            </p>

            <div style="text-align:center; margin:32px 0;">
            <a href="{verify_url}"
                style="background:#2563eb;
                    color:white;
                    padding:12px 22px;
                    font-size:15px;
                    border-radius:8px;
                    text-decoration:none;
                    display:inline-block;
                    font-weight:600;">
                Verify Email
            </a>
            </div>

            <p style="color:#6b7280; font-size:14px;">
            If you didn't create this account, you can ignore this email.
            </p>

            <hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;">

            <p style="font-size:13px; color:#9ca3af; margin:0;">
            This email was automatically sent from the Calculus system.
            </p>

        </div>
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