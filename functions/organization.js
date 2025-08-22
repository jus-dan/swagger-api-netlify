const express = require('express');
const serverless = require('serverless-http');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const app = express();
const router = express.Router();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase Umgebungsvariablen fehlen:', { 
    hasUrl: !!supabaseUrl, 
    hasKey: !!supabaseKey 
  });
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ========================================
// TEST ROUTE
// ========================================

router.get('/test', (req, res) => {
  console.log('🧪 GET /test aufgerufen');
  res.json({ 
    message: 'Organization API läuft!',
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey
    }
  });
});

// ========================================
// WORKSPACE REGISTRATION
// ========================================

router.post('/register', async (req, res) => {
  console.log('🔄 POST /register empfangen');
  console.log('📋 Request Body:', req.body);
  
  try {
    const { 
      organizationName, 
      organizationSlug, 
      adminEmail, 
      adminName, 
      adminPassword 
    } = req.body;

    // Validierung
    if (!organizationName || !organizationSlug || !adminEmail || !adminName || !adminPassword) {
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
      return res.status(400).json({ 
        error: 'Passwort muss mindestens 6 Zeichen lang sein' 
      });
    }

    // Prüfe ob Workspace-Slug bereits existiert
    const { data: existingOrg, error: orgCheckError } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organizationSlug)
      .single();

    if (existingOrg) {
      return res.status(400).json({ 
        error: 'Workspace-Slug bereits vergeben' 
      });
    }

    // Prüfe ob Admin-E-Mail bereits existiert
    const { data: existingPerson, error: personCheckError } = await supabase
      .from('person')
      .select('id')
      .eq('email', adminEmail.toLowerCase())
      .single();

    if (existingPerson) {
      return res.status(400).json({ 
        error: 'E-Mail-Adresse bereits vergeben' 
      });
    }

    // Passwort hashen
    const passwordHash = await bcrypt.hash(adminPassword, 12);

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
        roles: 'admin',
        organization_id: organization.id
      }])
      .select()
      .single();

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
        password: passwordHash
      }])
      .select()
      .single();

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
        .eq('value', 'admin')
        .single();

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

    res.status(201).json({
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
    });

  } catch (err) {
    console.error('❌ Fehler bei der Workspace-Registrierung:', err);
    res.status(500).json({ 
      error: 'Serverfehler bei der Registrierung',
      details: err.message
    });
  }
});

// ========================================
// ROUTES SETUP
// ========================================

app.use('/.netlify/functions/organization', router);

module.exports.handler = serverless(app);
