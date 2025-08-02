import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon'
import crypto from 'crypto'

export default class MailController {
  // Send email verification
  async sendVerification({ request, response }: HttpContext) {
    try {
      const { email } = request.only(['email'])

      if (!email) {
        return response.badRequest({
          message: 'Email is required',
        })
      }

      const user = await User.query().where('email', email).first()

      if (!user) {
        return response.notFound({
          message: 'User not found with this email address',
        })
      }

      if (user.isEmailVerified) {
        return response.badRequest({
          message: 'Email is already verified',
        })
      }

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex')
      const expiresAt = DateTime.now().plus({ hours: 1 })

      await user
        .merge({
          verificationToken,
          verificationExpiresAt: expiresAt,
        })
        .save()

      const verificationUrl = `${process.env.TUNNEL_URL}/api/verify-email?token=${verificationToken}&email=${user.email}`

      await mail.send((message) => {
        message
          .to(user.email)
          .from(process.env.SMTP_FROM_NAME || 'noreply@swineprofiteer.com')
          .subject('Verify Your Email - Swine Profiteer').html(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Verify Your Email</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f8f9fa; }
                    .container { max-width: 600px; margin: 30px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { background: #4CAF50; color: white; padding: 40px 20px; text-align: center; }
                    .header h1 { margin: 0; font-size: 28px; font-weight: 500; }
                    .header p { margin: 10px 0 0; opacity: 0.9; }
                    .content { padding: 40px 30px; text-align: center; }
                    .content h2 { color: #333; margin: 0 0 20px; font-size: 22px; }
                    .content p { color: #666; margin: 15px 0; }
                    .button { 
                        display: inline-block; 
                        background: #4CAF50;
                        color: white; 
                        padding: 16px 32px; 
                        text-decoration: none; 
                        border-radius: 6px; 
                        margin: 30px 0;
                        font-weight: 500;
                        box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
                    }
                    .button:hover { background: #45a049; }
                    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Swine Profiteer</h1>
                        <p>Welcome to the future of pig farming!</p>
                    </div>
                    <div class="content">
                        <h2>Hi ${user.fname},</h2>
                        <p>Welcome to Swine Profiteer! We're excited to have you on board.</p>
                        <p>Please verify your email address to get started:</p>
                        <a href="${verificationUrl}" class="button">Verify Email Address</a>
                        <p style="font-size: 14px; color: #999;">This link expires in 1 hour for security.</p>
                    </div>
                    <div class="footer">
                        <p>© 2025 Swine Profiteer. Making pig farming profitable!</p>
                    </div>
                </div>
            </body>
            </html>
          `)
      })

      return response.ok({
        message: 'Verification email sent successfully.',
        expires_at: expiresAt.toISO(),
      })
    } catch (error) {
      return response.internalServerError({
        message: 'An error occurred while sending verification email.',
        error: error.message,
      })
    }
  }

  // Verify email method (updated to handle both API and form)
  async verifyEmail({ request, response }: HttpContext) {
    try {
      const { token, email } = request.only(['token', 'email'])

      if (!token || !email) {
        return response.badRequest({
          message: 'Token and email are required',
        })
      }

      const user = await User.query()
        .where('email', email)
        .where('verification_token', token)
        .first()

      if (!user) {
        return response.badRequest({
          message: 'Invalid verification token or email',
        })
      }

      if (user.isEmailVerified) {
        return response.badRequest({
          message: 'Email is already verified',
        })
      }

      if (user.verificationExpiresAt && DateTime.now() > user.verificationExpiresAt) {
        return response.badRequest({
          message: 'Verification token has expired.',
        })
      }

      await user
        .merge({
          isEmailVerified: true,
          verificationToken: null,
          verificationExpiresAt: null,
          emailVerifiedAt: DateTime.now(),
        })
        .save()

      // Check if it's a form submission or API call
      const acceptsHtml = request.header('accept')?.includes('text/html')

      if (acceptsHtml) {
        // Return HTML page for success
        return response.ok(`
          <!DOCTYPE html>
          <html>
          <head>
              <meta charset="utf-8">
              <title>Email Verified - Swine Profiteer</title>
              <style>
                  body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
                  .container { max-width: 600px; margin: 50px auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                  .header { background: #4CAF50; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { padding: 30px; text-align: center; }
                  .success { color: #4CAF50; font-size: 48px; margin-bottom: 20px; }
                  .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
              </style>
          </head>
          <body>
              <div class="container">
                  <div class="header">
                      <h1>Swine Profiteer</h1>
                  </div>
                  <div class="content">
                      <div class="success">✅</div>
                      <h2>Email Verified Successfully!</h2>
                      <p>Hello <strong>${user.fname} ${user.lname}</strong>,</p>
                      <p>Your email <strong>${user.email}</strong> has been verified successfully.</p>
                      <p>You can now close this tab.</p>
                  </div>
              </div>
          </body>
          </html>
        `)
      } else {
        // Return JSON for API calls
        return response.ok({
          message: 'Email verified successfully!',
          user: {
            id: user.id,
            email: user.email,
            is_email_verified: user.isEmailVerified,
          },
        })
      }
    } catch (error) {
      return response.internalServerError({
        message: 'An error occurred while verifying email.',
        error: error.message,
      })
    }
  }

  // Show verification form (for manual verification)
  async showVerificationForm({ request, response }: HttpContext) {
    const { token, email } = request.qs()

    return response.ok(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Email - Swine Profiteer</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                background: #f8fafc; 
                min-height: 100vh; 
                padding: 20px; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                color: #334155;
                line-height: 1.6;
            }
            .container { 
                width: 100%; 
                max-width: 420px; 
                background: white; 
                border-radius: 16px; 
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); 
                overflow: hidden;
            }
            .header { 
                background: linear-gradient(135deg, #059669 0%, #047857 100%); 
                color: white; 
                padding: 32px 24px; 
                text-align: center; 
                position: relative;
                overflow: hidden;
            }
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="80" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="60" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                opacity: 0.3;
            }
            .header h1 { 
                margin: 0; 
                font-size: 28px; 
                font-weight: 700; 
                position: relative; 
                z-index: 1;
            }
            .header p { 
                margin: 8px 0 0; 
                opacity: 0.9; 
                font-size: 16px; 
                font-weight: 400; 
                position: relative; 
                z-index: 1;
            }
            .content { 
                padding: 32px 24px; 
            }
            .form-group { 
                margin-bottom: 24px; 
            }
            label { 
                display: block; 
                margin-bottom: 8px; 
                font-weight: 600; 
                color: #374151; 
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            input { 
                width: 100%; 
                padding: 16px; 
                border: 2px solid #e5e7eb; 
                border-radius: 12px; 
                font-size: 16px; 
                transition: all 0.2s ease; 
                background: #f9fafb;
                color: #374151;
            }
            input:focus { 
                border-color: #059669; 
                background: white;
                outline: none; 
                box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
                transform: translateY(-1px);
            }
            .btn-primary { 
                width: 100%; 
                background: linear-gradient(135deg, #059669 0%, #047857 100%); 
                color: white; 
                padding: 16px; 
                border: none; 
                border-radius: 12px; 
                cursor: pointer; 
                font-size: 16px; 
                font-weight: 600; 
                transition: all 0.2s ease;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                position: relative;
                overflow: hidden;
            }
            .btn-primary:hover { 
                transform: translateY(-2px); 
                box-shadow: 0 8px 25px rgba(5, 150, 105, 0.3);
            }
            .btn-primary:active { 
                transform: translateY(0); 
            }
            .btn-primary:disabled { 
                background: #9ca3af; 
                transform: none; 
                cursor: not-allowed; 
                box-shadow: none;
            }
            .btn-secondary { 
                background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); 
                color: white; 
                padding: 12px 24px; 
                border: none; 
                border-radius: 8px; 
                cursor: pointer; 
                font-size: 14px; 
                font-weight: 600; 
                transition: all 0.2s ease;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            .btn-secondary:hover { 
                transform: translateY(-1px); 
                box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
            }
            .btn-secondary:disabled { 
                background: #9ca3af; 
                transform: none; 
                cursor: not-allowed; 
                box-shadow: none;
            }
            .divider { 
                text-align: center; 
                margin: 32px 0; 
                padding-top: 24px; 
                border-top: 1px solid #e5e7eb; 
                position: relative;
            }
            .divider::before {
                content: '';
                position: absolute;
                top: -1px;
                left: 50%;
                transform: translateX(-50%);
                width: 60px;
                height: 2px;
                background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
            }
            .divider p { 
                color: #6b7280; 
                font-size: 14px; 
                margin-bottom: 16px;
            }
            .message { 
                padding: 16px; 
                border-radius: 8px; 
                margin: 16px 0; 
                font-size: 14px;
                font-weight: 500;
            }
            .message.success { 
                background: #d1fae5; 
                color: #065f46; 
                border: 1px solid #a7f3d0; 
            }
            .message.error { 
                background: #fee2e2; 
                color: #991b1b; 
                border: 1px solid #fca5a5; 
            }
            .success-page {
                text-align: center; 
                padding: 60px 40px; 
                background: #f8fafc; 
                min-height: 100vh; 
                display: flex; 
                align-items: center; 
                justify-content: center;
            }
            .success-card {
                background: white; 
                border-radius: 20px; 
                padding: 48px 40px; 
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); 
                max-width: 400px; 
                width: 100%;
            }
            .success-icon {
                width: 80px; 
                height: 80px; 
                background: linear-gradient(135deg, #059669, #047857); 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                margin: 0 auto 24px; 
                font-size: 36px; 
                color: white;
                box-shadow: 0 8px 20px rgba(5, 150, 105, 0.3);
            }
            .success-title { 
                font-size: 32px; 
                font-weight: 800; 
                color: #059669; 
                margin-bottom: 16px; 
            }
            .success-text { 
                color: #6b7280; 
                font-size: 16px; 
                margin-bottom: 32px; 
                line-height: 1.6;
            }
            .close-text {
                color: #9ca3af; 
                font-size: 14px; 
                font-style: italic;
            }
            
            @media (max-width: 480px) {
                body { padding: 12px; }
                .container { border-radius: 12px; }
                .header { padding: 24px 16px; }
                .header h1 { font-size: 24px; }
                .content { padding: 24px 16px; }
                .form-group { margin-bottom: 20px; }
                input { padding: 14px; font-size: 16px; }
                .btn-primary { padding: 14px; }
                .success-card { padding: 32px 24px; }
                .success-icon { width: 64px; height: 64px; font-size: 28px; }
                .success-title { font-size: 24px; }
            }
            
            @media (max-width: 320px) {
                .content { padding: 20px 12px; }
                .header { padding: 20px 12px; }
                .success-card { padding: 24px 16px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Swine Profiteer</h1>
                <p>Email Verification</p>
            </div>
            <div class="content" id="mainContent">
                <div id="messageArea"></div>
                
                ${
                  token && email
                    ? `
                <script>
                    // Hide the form immediately if auto-verifying
                    document.getElementById('mainContent').style.display = 'none';
                    
                    fetch('/api/verify-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token: '${token}', email: '${email}' })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.message.includes('successfully')) {
                            document.body.innerHTML = \`
                                <div class="success-page">
                                    <div class="success-card">
                                        <div class="success-icon">✓</div>
                                        <div class="success-title">Verified!</div>
                                        <div class="success-text">Your email has been successfully verified. Your account is now active and ready to use.</div>
                                        <div class="close-text">You can close this tab now</div>
                                    </div>
                                </div>
                            \`;
                        } else {
                            document.getElementById('mainContent').style.display = 'block';
                            document.getElementById('messageArea').innerHTML = '<div class="message error">' + data.message + '</div>';
                        }
                    })
                    .catch(() => {
                        document.getElementById('mainContent').style.display = 'block';
                        document.getElementById('messageArea').innerHTML = '<div class="message error">Verification failed. Please try manually below.</div>';
                    });
                </script>
                `
                    : ''
                }
                
                <form id="verifyForm">
                    <div class="form-group">
                        <label for="email">Email Address</label>
                        <input type="email" id="email" name="email" value="${email || ''}" required placeholder="Enter your email address">
                    </div>
                    <div class="form-group">
                        <label for="token">Verification Token</label>
                        <input type="text" id="token" name="token" value="${token || ''}" required placeholder="Enter verification token">
                    </div>
                    <button type="submit" class="btn-primary">Verify Email</button>
                </form>
                
                <div class="divider">
                    <p>Didn't receive an email?</p>
                    <button id="resendBtn" class="btn-secondary">Resend Email</button>
                    <div id="resendMessage"></div>
                </div>
            </div>
        </div>

        <script>
            let cooldownTime = 0;
            let timer;

            function startCooldown() {
                cooldownTime = 60;
                const btn = document.getElementById('resendBtn');
                btn.disabled = true;
                
                timer = setInterval(() => {
                    btn.textContent = \`Wait \${cooldownTime}s\`;
                    cooldownTime--;
                    
                    if (cooldownTime < 0) {
                        clearInterval(timer);
                        btn.disabled = false;
                        btn.textContent = 'Resend Email';
                    }
                }, 1000);
            }

            document.getElementById('resendBtn').addEventListener('click', function() {
                const email = document.getElementById('email').value;
                if (!email) {
                    document.getElementById('resendMessage').innerHTML = '<div class="message error">Please enter your email first!</div>';
                    return;
                }

                startCooldown();
                document.getElementById('resendMessage').innerHTML = '';
                
                fetch('/api/resend-verification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email })
                })
                .then(response => response.json())
                .then(data => {
                    const msgDiv = document.getElementById('resendMessage');
                    if (data.message.includes('successfully') || data.message.includes('resent')) {
                        msgDiv.innerHTML = '<div class="message success">' + data.message + '</div>';
                    } else {
                        msgDiv.innerHTML = '<div class="message error">' + data.message + '</div>';
                    }
                })
                .catch(() => {
                    document.getElementById('resendMessage').innerHTML = '<div class="message error">Failed to resend email.</div>';
                });
            });

            document.getElementById('verifyForm').addEventListener('submit', function(e) {
                e.preventDefault();
                const btn = e.target.querySelector('button');
                const originalText = btn.textContent;
                btn.textContent = 'Verifying...';
                btn.disabled = true;
                
                const formData = new FormData(e.target);
                fetch('/api/verify-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.get('email'),
                        token: formData.get('token')
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.message.includes('successfully')) {
                        document.body.innerHTML = \`
                            <div class="success-page">
                                <div class="success-card">
                                    <div class="success-icon">✓</div>
                                    <div class="success-title">Verified!</div>
                                    <div class="success-text">Your email has been successfully verified. Your account is now active and ready to use.</div>
                                    <div class="close-text">You can close this tab now</div>
                                </div>
                            </div>
                        \`;
                    } else {
                        document.getElementById('messageArea').innerHTML = '<div class="message error">' + data.message + '</div>';
                    }
                })
                .catch(() => {
                    document.getElementById('messageArea').innerHTML = '<div class="message error">Verification failed. Please try again.</div>';
                })
                .finally(() => {
                    btn.disabled = false;
                    btn.textContent = originalText;
                });
            });
        </script>
    </body>
    </html>
  `)
  }

  // Resend verification
  async resendVerification({ request, response }: HttpContext) {
    try {
      const { email } = request.only(['email'])

      if (!email) {
        return response.badRequest({
          message: 'Email is required',
        })
      }

      const user = await User.query().where('email', email).first()

      if (!user) {
        return response.notFound({
          message: 'User not found',
        })
      }

      if (user.isEmailVerified) {
        return response.badRequest({
          message: 'Email is already verified',
        })
      }

      const verificationToken = crypto.randomBytes(32).toString('hex')
      const expiresAt = DateTime.now().plus({ hours: 1 })

      await user
        .merge({
          verificationToken,
          verificationExpiresAt: expiresAt,
        })
        .save()

      const verificationUrl = `${process.env.TUNNEL_URL}/api/verify-email?token=${verificationToken}&email=${user.email}`

      await mail.send((message) => {
        message.to(user.email).subject('Verify Your Email - Resent').html(`
            <h1>Swine Profiteer</h1>
            <h2>Hi ${user.fname},</h2>
            <p>Here's your verification link again:</p>
            <a href="${verificationUrl}" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none;">Verify Email</a>
            <p>Link: ${verificationUrl}</p>
          `)
      })

      return response.ok({
        message: 'Verification email resent.',
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error resending email.',
        error: error.message,
      })
    }
  }
}
