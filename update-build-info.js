#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Funktion um Git-Informationen zu holen
function getGitInfo() {
  try {
    const gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const gitShortHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const lastCommitDate = execSync('git log -1 --format=%cd --date=iso', { encoding: 'utf8' }).trim();
    const lastCommitMessage = execSync('git log -1 --format=%s', { encoding: 'utf8' }).trim();
    
    return {
      gitCommit,
      gitShortHash,
      gitBranch,
      lastCommitDate,
      lastCommitMessage
    };
  } catch (error) {
    console.warn('Git-Informationen konnten nicht abgerufen werden:', error.message);
    return {
      gitCommit: 'unknown',
      gitShortHash: 'dev',
      gitBranch: 'unknown',
      lastCommitDate: new Date().toISOString(),
      lastCommitMessage: 'Unknown commit'
    };
  }
}

// Funktion um die aktuelle Version aus package.json zu lesen
function getCurrentVersion() {
  try {
    const packagePath = path.join(__dirname, 'frontend', 'package.json');
    const packageContent = fs.readFileSync(packagePath, 'utf8');
    const packageJson = JSON.parse(packageContent);
    return packageJson.version;
  } catch (error) {
    console.error('Fehler beim Lesen der package.json:', error.message);
    return '1.0.0';
  }
}

// Funktion um die Version zu erhöhen
// major.minor.patch (semantic versioning)
function incrementVersion(version, incrementType = 'patch') {
  const [major, minor, patch] = version.split('.').map(Number);
  
  switch (incrementType) {
    case 'major':
      return `${major + 1}.0.0`;        // Breaking changes
    case 'minor':
      return `${major}.${minor + 1}.0`; // New features
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`; // Bug fixes & builds
  }
}

// Funktion um die Build-Nummer zu generieren
function generateBuildNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  
  return `${year}${month}${day}-${hour}${minute}`;
}

// Hauptfunktion
function updateBuildInfo() {
  console.log('🔄 Aktualisiere Build-Informationen...');
  
  // Git-Informationen holen
  const gitInfo = getGitInfo();
  
  // Aktuelle Version lesen
  const currentVersion = getCurrentVersion();
  
  // Version erhöhen (patch/micro für jeden Build)
  // 1.0.0 -> 1.0.1 -> 1.0.2 -> 1.0.3
  const newVersion = incrementVersion(currentVersion, 'patch');
  
  // Build-Nummer generieren
  const buildNumber = generateBuildNumber();
  
  // Build-Info aktualisieren
  const buildInfoContent = `// Build-Informationen - wird bei jedem Build aktualisiert
export const BUILD_INFO = {
  version: '${newVersion}',
  buildNumber: '${buildNumber}',
  buildDate: '${new Date().toISOString()}',
  gitCommit: '${gitInfo.gitCommit}',
  gitBranch: '${gitInfo.gitBranch}',
  gitShortHash: '${gitInfo.gitShortHash}',
  lastCommitDate: '${gitInfo.lastCommitDate}',
  lastCommitMessage: '${gitInfo.lastCommitMessage.replace(/'/g, "\\'")}'
};

// Hilfsfunktion um Build-Info zu formatieren
export const getBuildInfoString = () => {
  return \`v\${BUILD_INFO.version} | Build \${BUILD_INFO.buildNumber} | \${BUILD_INFO.gitShortHash}\`;
};

// Hilfsfunktion um detaillierte Build-Info zu formatieren
export const getDetailedBuildInfo = () => {
  return {
    version: BUILD_INFO.version,
    buildNumber: BUILD_INFO.buildNumber,
    buildDate: BUILD_INFO.buildDate,
    gitInfo: \`\${BUILD_INFO.gitBranch}/\${BUILD_INFO.gitShortHash}\`,
    lastCommit: BUILD_INFO.lastCommitMessage
  };
};
`;
  
  // Datei schreiben
  const buildInfoPath = path.join(__dirname, 'frontend', 'build-info.js');
  fs.writeFileSync(buildInfoPath, buildInfoContent);
  
  // package.json aktualisieren
  try {
    const packagePath = path.join(__dirname, 'frontend', 'package.json');
    const packageContent = fs.readFileSync(packagePath, 'utf8');
    const packageJson = JSON.parse(packageContent);
    packageJson.version = newVersion;
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  } catch (error) {
    console.warn('package.json konnte nicht aktualisiert werden:', error.message);
  }
  
  console.log('✅ Build-Informationen aktualisiert:');
  console.log(`   Version: ${newVersion}`);
  console.log(`   Build: ${buildNumber}`);
  console.log(`   Git: ${gitInfo.gitBranch}/${gitInfo.gitShortHash}`);
  console.log(`   Commit: ${gitInfo.lastCommitMessage}`);
}

// Script ausführen
if (require.main === module) {
  updateBuildInfo();
}

module.exports = { updateBuildInfo };
