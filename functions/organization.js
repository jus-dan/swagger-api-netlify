const express = require('express');
const serverless = require('serverless-http');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

console.log('🚀 Organization.js wird geladen...');

const app = express();
const router = express.Router();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

console.log('✅ Middleware geladen');

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('🔍 Umgebungsvariablen prüfen:', {
  hasSupabaseUrl: !!supabaseUrl,
  hasSupabaseKey: !!supabaseKey,
  supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'FEHLT',
  supabaseKey: supabaseKey ? `${supabaseKey.substring(0, 10)}...` : 'FEHLT'
});

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase Umgebungsvariablen fehlen:', { 
    hasUrl: !!supabaseUrl, 
    hasKey: !!supabaseKey 
  });
}

let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase Client erstellt');
} catch (error) {
  console.error('❌ Fehler beim Erstellen des Supabase Clients:', error);
}

// ========================================
// TEST ROUTE
// ========================================

router.get('/test', (req, res) => {
  console.log('🧪 GET /test aufgerufen');
  try {
    const response = {
      message: 'Organization API läuft!',
      timestamp: new Date().toISOString(),
      env: {
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseKey,
        nodeEnv: process.env.NODE_ENV,
        nodeVersion: process.version
      },
      supabase: {
        hasClient: !!supabase,
        clientType: supabase ? typeof supabase : 'undefined'
      }
    };
    
    console.log('📤 Test-Antwort:', response);
    res.json(response);
  } catch (error) {
    console.error('❌ Fehler in Test-Route:', error);
    res.status(500).json({ error: 'Test-Route Fehler', details: error.message });
  }
});

// ========================================
// WORKSPACE REGISTRATION
// ========================================

router.post('/register', async (req, res) => {
  console.log('🔄 POST /register empfangen');
  console.log('📋 Request Body:', req.body);
  console.log('📋 Request Headers:', req.headers);
  
  try {
    // Prüfe Supabase-Client
    if (!supabase) {
      console.error('❌ Supabase Client nicht verfügbar');
      return res.status(500).json({ 
        error: 'Supabase Client nicht verfügbar',
        debug: {
          hasSupabaseUrl: !!supabaseUrl,
          hasSupabaseKey: !!supabaseKey
        }
      });
    }

    // Parse Buffer to JSON if needed
    let body = req.body;
    if (Buffer.isBuffer(body)) {
      console.log('🔧 Buffer erkannt, parse zu JSON...');
      try {
        body = JSON.parse(body.toString());
        console.log('✅ Buffer erfolgreich geparst:', body);
      } catch (parseError) {
        console.error('❌ Fehler beim Parsen des Buffers:', parseError);
        return res.status(400).json({ 
          error: 'Ungültiger JSON-Request',
          details: parseError.message
        });
      }
    }

    const { 
      organizationName, 
      organizationSlug, 
      adminEmail, 
      adminName, 
      adminPassword 
    } = body;

    console.log('🔍 Validierung der Eingabedaten:', {
      organizationName: !!organizationName,
      organizationSlug: !!organizationSlug,
      adminEmail: !!adminEmail,
      adminName: !!adminName,
      adminPassword: !!adminPassword,
      passwordLength: adminPassword ? adminPassword.length : 0
    });

    // Validierung
    if (!organizationName || !organizationSlug || !adminEmail || !adminName || !adminPassword) {
      console.log('❌ Validierung fehlgeschlagen - fehlende Felder');
      return res.status(400).json({ 
        error: 'Alle Felder sind erforderlich',
        missing: {
          organizationName: !organizationName,
          organizationSlug: !organizationSlug,
          adminEmail: !adminEmail,
          adminName: !adminName,
          adminPassword: !adminPassword
        }
      });
    }

    if (adminPassword.length < 6) {
      console.log('❌ Passwort zu kurz:', adminPassword.length);
      return res.status(400).json({ 
        error: 'Passwort muss mindestens 6 Zeichen lang sein' 
      });
    }

    console.log('✅ Validierung erfolgreich');

    // Prüfe ob Workspace-Slug bereits existiert
    console.log('🔍 Prüfe Workspace-Slug:', organizationSlug);
    const { data: existingOrg, error: orgCheckError } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organizationSlug)
      .single();

    console.log('🔍 Workspace-Slug Prüfung Ergebnis:', { existingOrg, orgCheckError });

    if (existingOrg) {
      console.log('❌ Workspace-Slug bereits vergeben');
      return res.status(400).json({ 
        error: 'Workspace-Slug bereits vergeben' 
      });
    }

    // Prüfe ob Admin-E-Mail bereits existiert
    console.log('🔍 Prüfe Admin-E-Mail:', adminEmail);
    const { data: existingPerson, error: personCheckError } = await supabase
      .from('person')
      .select('id')
      .eq('email', adminEmail.toLowerCase())
      .single();

    console.log('🔍 Admin-E-Mail Prüfung Ergebnis:', { existingPerson, personCheckError });

    if (existingPerson) {
      console.log('❌ Admin-E-Mail bereits vergeben');
      return res.status(400).json({ 
        error: 'E-Mail-Adresse bereits vergeben' 
      });
    }

    // Passwort hashen
    console.log('🔐 Hashe Passwort...');
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    console.log('✅ Passwort gehasht');

    // 1. Organization erstellen
    console.log('🏢 Erstelle Organization:', { name: organizationName, slug: organizationSlug });
    
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert([{
        name: organizationName.trim(),
        slug: organizationSlug.trim(),
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    console.log('🔍 Organization Erstellung Ergebnis:', { organization, orgError });

    if (orgError) {
      console.error('❌ Fehler beim Erstellen der Organization:', orgError);
      return res.status(500).json({ 
        error: 'Fehler beim Erstellen des Workspaces',
        details: orgError.message
      });
    }

    console.log('✅ Organization erstellt:', organization.id);

    // 2. Admin-Person erstellen
    console.log('👤 Erstelle Admin-Person:', { name: adminName, email: adminEmail });
    
         const { data: person, error: personError } = await supabase
       .from('person')
       .insert([{
         name: adminName.trim(),
         email: adminEmail.toLowerCase(),
         roles: ['admin'], // Als Array senden
         organization_id: organization.id
       }])
       .select()
       .single();

    console.log('🔍 Admin-Person Erstellung Ergebnis:', { person, personError });

    if (personError) {
      console.error('❌ Fehler beim Erstellen der Admin-Person:', personError);
      return res.status(500).json({ 
        error: 'Fehler beim Erstellen des Admin-Kontos',
        details: personError.message
      });
    }

    console.log('✅ Admin-Person erstellt:', person.id);

    // 3. Admin-Benutzer erstellen
    console.log('🔐 Erstelle Admin-Benutzer');
    
         const { data: user, error: userError } = await supabase
       .from('users')
       .insert([{
         person_id: person.id,
         username: adminEmail.toLowerCase().split('@')[0], // Username aus E-Mail
         password_hash: passwordHash // Korrekter Feldname laut Schema
       }])
       .select()
       .single();

    console.log('🔍 Admin-Benutzer Erstellung Ergebnis:', { user, userError });

    if (userError) {
      console.error('❌ Fehler beim Erstellen des Admin-Benutzers:', userError);
      return res.status(500).json({ 
        error: 'Fehler beim Erstellen des Admin-Kontos',
        details: userError.message
      });
    }

    console.log('✅ Admin-Benutzer erstellt:', user.id);

    // 4. Admin-Rolle zuweisen
    console.log('👑 Weise Admin-Rolle zu');
    
         try {
       const { data: roleData, error: roleQueryError } = await supabase
         .from('roles')
         .select('id')
         .eq('name', 'admin') // Korrekter Feldname laut Schema
         .single();

       console.log('🔍 Admin-Rolle Abfrage Ergebnis:', { roleData, roleQueryError });

       if (roleData && !roleQueryError) {
         const { error: roleError } = await supabase
           .from('user_roles')
           .insert([{
             user_id: user.id,
             role_id: roleData.id
           }]);

         if (roleError) {
           console.warn('⚠️ Warnung: Fehler beim Zuweisen der Admin-Rolle:', roleError);
         } else {
           console.log('✅ Admin-Rolle zugewiesen');
         }
       } else {
         console.warn('⚠️ Warnung: Admin-Rolle nicht gefunden');
       }
     } catch (roleErr) {
       console.warn('⚠️ Warnung: Fehler bei der Rollen-Zuweisung:', roleErr);
     }

    // 5. Organization-Admin verknüpfen
    console.log('🔗 Verknüpfe Organization mit Admin');
    
    const { error: orgAdminError } = await supabase
      .from('organization_admins')
      .insert([{
        organization_id: organization.id,
        user_id: user.id
      }]);

    if (orgAdminError) {
      console.warn('⚠️ Warnung: Fehler beim Verknüpfen des Admins:', orgAdminError);
    } else {
      console.log('✅ Organization-Admin verknüpft');
    }

    console.log('🎉 Workspace erfolgreich registriert!', {
      organizationId: organization.id,
      personId: person.id,
      userId: user.id
    });

    const response = {
      message: 'Workspace erfolgreich registriert!',
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        adminEmail: adminEmail,
        adminName: adminName
      },
      user: {
        id: user.id,
        username: user.username,
        email: adminEmail
      }
    };

    console.log('📤 Sende Erfolgs-Antwort:', response);
    res.status(201).json(response);

  } catch (err) {
    console.error('❌ Fehler bei der Workspace-Registrierung:', err);
    console.error('❌ Fehler-Stack:', err.stack);
    res.status(500).json({ 
      error: 'Serverfehler bei der Registrierung',
      details: err.message,
      stack: err.stack
    });
  }
});

// ========================================
// ROUTES SETUP
// ========================================

app.use('/.netlify/functions/organization', router);

console.log('✅ Routes konfiguriert');

module.exports.handler = serverless(app);

console.log('✅ Organization.js Handler exportiert');
