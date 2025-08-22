const sgMail = require('@sendgrid/mail');

// SendGrid API Key setzen
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ========================================
// E-MAIL TEMPLATES
// ========================================

const getPasswordResetEmail = (resetUrl, userName) => {
  return {
    to: '', // Wird beim Aufruf gesetzt
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@benchtime.app',
    subject: '🔐 Passwort zurücksetzen - BenchTime',
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Passwort zurücksetzen - BenchTime</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container { 
            background: white; 
            padding: 40px; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin: 20px 0;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #3498db; 
            padding-bottom: 20px;
          }
          .logo { 
            font-size: 2.5rem; 
            color: #3498db; 
            margin-bottom: 10px;
          }
          .title { 
            color: #2c3e50; 
            font-size: 1.8rem; 
            margin: 0;
          }
          .subtitle { 
            color: #7f8c8d; 
            font-size: 1.1rem; 
            margin: 10px 0 0 0;
          }
          .content { 
            margin: 30px 0; 
            line-height: 1.8;
          }
          .reset-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #3498db, #2980b9); 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            font-size: 1.1rem;
            margin: 20px 0;
            text-align: center;
          }
          .reset-button:hover { 
            background: linear-gradient(135deg, #2980b9, #1f5f8b); 
          }
          .info-box { 
            background: #f8f9fa; 
            border-left: 4px solid #3498db; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 0 8px 8px 0;
          }
          .info-box h3 { 
            color: #2c3e50; 
            margin-top: 0; 
            font-size: 1.2rem;
          }
          .info-box ul { 
            margin: 15px 0; 
            padding-left: 20px;
          }
          .info-box li { 
            margin-bottom: 8px; 
            color: #34495e;
          }
          .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e9ecef; 
            color: #7f8c8d; 
            font-size: 0.9rem;
          }
          .warning { 
            background: #fff3cd; 
            border: 1px solid #ffeaa7; 
            border-radius: 6px; 
            padding: 15px; 
            margin: 20px 0; 
            color: #856404;
          }
          .warning strong { 
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">⏰</div>
            <h1 class="title">BenchTime</h1>
            <p class="subtitle">Werkstatt-Management Plattform</p>
          </div>
          
          <div class="content">
            <h2>Hallo ${userName || 'Benutzer'}!</h2>
            
            <p>Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.</p>
            
            <p>Klicke auf den folgenden Button, um ein neues Passwort zu setzen:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="reset-button">
                🔐 Passwort zurücksetzen
              </a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Wichtig:</strong> Falls du diese Anfrage nicht gestellt hast, 
              kannst du diese E-Mail ignorieren. Dein Passwort bleibt unverändert.
            </div>
            
            <div class="info-box">
              <h3>ℹ️ Wie funktioniert das?</h3>
              <ul>
                <li>Klicke auf den "Passwort zurücksetzen" Button</li>
                <li>Du wirst zu einer sicheren Seite weitergeleitet</li>
                <li>Gib dein neues Passwort ein</li>
                <li>Bestätige das neue Passwort</li>
                <li>Melde dich mit dem neuen Passwort an</li>
              </ul>
            </div>
            
            <div class="info-box">
              <h3>🔒 Sicherheitshinweise</h3>
              <ul>
                <li>Der Link ist nur <strong>24 Stunden</strong> gültig</li>
                <li>Verwende ein <strong>sicheres Passwort</strong> (mindestens 8 Zeichen)</li>
                <li>Teile den Link <strong>niemals</strong> mit anderen</li>
                <li>Lösche diese E-Mail nach dem Zurücksetzen</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>Diese E-Mail wurde automatisch generiert. Bitte nicht antworten.</p>
            <p>© 2024 BenchTime - Werkstatt-Management Plattform</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Passwort zurücksetzen - BenchTime

Hallo ${userName || 'Benutzer'}!

Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.

Klicke auf den folgenden Link, um ein neues Passwort zu setzen:
${resetUrl}

WICHTIG: Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren. Dein Passwort bleibt unverändert.

Wie funktioniert das?
1. Klicke auf den Link
2. Du wirst zu einer sicheren Seite weitergeleitet
3. Gib dein neues Passwort ein
4. Bestätige das neue Passwort
5. Melde dich mit dem neuen Passwort an

Sicherheitshinweise:
- Der Link ist nur 24 Stunden gültig
- Verwende ein sicheres Passwort (mindestens 8 Zeichen)
- Teile den Link niemals mit anderen
- Lösche diese E-Mail nach dem Zurücksetzen

Diese E-Mail wurde automatisch generiert. Bitte nicht antworten.

© 2024 BenchTime - Werkstatt-Management Plattform
    `
  };
};

const getWelcomeEmail = (userName, organizationName) => {
  return {
    to: '', // Wird beim Aufruf gesetzt
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@benchtime.app',
    subject: '🎉 Willkommen bei BenchTime!',
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Willkommen bei BenchTime</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container { 
            background: white; 
            padding: 40px; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin: 20px 0;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #27ae60; 
            padding-bottom: 20px;
          }
          .logo { 
            font-size: 2.5rem; 
            color: #27ae60; 
            margin-bottom: 10px;
          }
          .title { 
            color: #2c3e50; 
            font-size: 1.8rem; 
            margin: 0;
          }
          .subtitle { 
            color: #7f8c8d; 
            font-size: 1.1rem; 
            margin: 10px 0 0 0;
          }
          .content { 
            margin: 30px 0; 
            line-height: 1.8;
          }
          .welcome-box { 
            background: linear-gradient(135deg, #27ae60, #2ecc71); 
            color: white; 
            padding: 30px; 
            border-radius: 12px; 
            text-align: center; 
            margin: 30px 0;
          }
          .welcome-box h2 { 
            margin: 0 0 15px 0; 
            font-size: 1.8rem;
          }
          .welcome-box p { 
            margin: 0; 
            font-size: 1.2rem; 
            opacity: 0.9;
          }
          .info-box { 
            background: #f8f9fa; 
            border-left: 4px solid #27ae60; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 0 8px 8px 0;
          }
          .info-box h3 { 
            color: #2c3e50; 
            margin-top: 0; 
            font-size: 1.2rem;
          }
          .info-box ul { 
            margin: 15px 0; 
            padding-left: 20px;
          }
          .info-box li { 
            margin-bottom: 8px; 
            color: #34495e;
          }
          .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e9ecef; 
            color: #7f8c8d; 
            font-size: 0.9rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">⏰</div>
            <h1 class="title">BenchTime</h1>
            <p class="subtitle">Werkstatt-Management Plattform</p>
          </div>
          
          <div class="content">
            <div class="welcome-box">
              <h2>🎉 Willkommen bei BenchTime!</h2>
              <p>Dein ${organizationName} Workspace wurde erfolgreich erstellt!</p>
            </div>
            
            <p>Hallo ${userName}!</p>
            
            <p>Vielen Dank, dass du dich für BenchTime entschieden hast. Dein Werkstatt-Management Workspace ist jetzt bereit und du kannst sofort loslegen!</p>
            
            <div class="info-box">
              <h3>🚀 Was du jetzt tun kannst:</h3>
              <ul>
                <li><strong>Anmelden:</strong> Verwende deine E-Mail-Adresse und dein Passwort</li>
                <li><strong>Workspace konfigurieren:</strong> Passe deine Organisation an</li>
                <li><strong>Benutzer einladen:</strong> Lade dein Team ein</li>
                <li><strong>Ressourcen verwalten:</strong> Füge Werkzeuge und Maschinen hinzu</li>
                <li><strong>Kategorien erstellen:</strong> Organisiere deine Ressourcen</li>
              </ul>
            </div>
            
            <div class="info-box">
              <h3>💡 Nächste Schritte:</h3>
              <ul>
                <li>Melde dich in deinem Workspace an</li>
                <li>Erstelle dein erstes Ressourcen-Inventar</li>
                <li>Lade dein Team ein</li>
                <li>Konfiguriere Rollen und Berechtigungen</li>
                <li>Nutze die API für Integrationen</li>
              </ul>
            </div>
            
            <p>Bei Fragen oder Problemen steht dir unser Support gerne zur Verfügung.</p>
            
            <p>Viel Erfolg mit deinem neuen BenchTime Workspace!</p>
          </div>
          
          <div class="footer">
            <p>© 2024 BenchTime - Werkstatt-Management Plattform</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Willkommen bei BenchTime!

Hallo ${userName}!

Vielen Dank, dass du dich für BenchTime entschieden hast. Dein ${organizationName} Workspace wurde erfolgreich erstellt und ist jetzt bereit!

Was du jetzt tun kannst:
- Anmelden: Verwende deine E-Mail-Adresse und dein Passwort
- Workspace konfigurieren: Passe deine Organisation an
- Benutzer einladen: Lade dein Team ein
- Ressourcen verwalten: Füge Werkzeuge und Maschinen hinzu
- Kategorien erstellen: Organisiere deine Ressourcen

Nächste Schritte:
1. Melde dich in deinem Workspace an
2. Erstelle dein erstes Ressourcen-Inventar
3. Lade dein Team ein
4. Konfiguriere Rollen und Berechtigungen
5. Nutze die API für Integrationen

Bei Fragen oder Problemen steht dir unser Support gerne zur Verfügung.

Viel Erfolg mit deinem neuen BenchTime Workspace!

© 2024 BenchTime - Werkstatt-Management Plattform
    `
  };
};

// ========================================
// E-MAIL FUNCTIONS
// ========================================

const sendPasswordResetEmail = async (toEmail, resetUrl, userName) => {
  try {
    const emailData = getPasswordResetEmail(resetUrl, userName);
    emailData.to = toEmail;
    
    console.log('📧 Sende Passwort-Reset E-Mail an:', toEmail);
    
    const result = await sgMail.send(emailData);
    
    console.log('✅ E-Mail erfolgreich gesendet:', result[0].statusCode);
    return { success: true, messageId: result[0].headers['x-message-id'] };
    
  } catch (error) {
    console.error('❌ Fehler beim Senden der E-Mail:', error);
    
    if (error.response) {
      console.error('❌ SendGrid Fehler Details:', error.response.body);
    }
    
    return { 
      success: false, 
      error: error.message,
      details: error.response?.body || 'Unbekannter Fehler'
    };
  }
};

const sendWelcomeEmail = async (toEmail, userName, organizationName) => {
  try {
    const emailData = getWelcomeEmail(userName, organizationName);
    emailData.to = toEmail;
    
    console.log('📧 Sende Willkommens-E-Mail an:', toEmail);
    
    const result = await sgMail.send(emailData);
    
    console.log('✅ Willkommens-E-Mail erfolgreich gesendet:', result[0].statusCode);
    return { success: true, messageId: result[0].headers['x-message-id'] };
    
  } catch (error) {
    console.error('❌ Fehler beim Senden der Willkommens-E-Mail:', error);
    
    if (error.response) {
      console.error('❌ SendGrid Fehler Details:', error.response.body);
    }
    
    return { 
      success: false, 
      error: error.message,
      details: error.response?.body || 'Unbekannter Fehler'
    };
  }
};

// ========================================
// EXPORTS
// ========================================

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  getPasswordResetEmail,
  getWelcomeEmail
};
