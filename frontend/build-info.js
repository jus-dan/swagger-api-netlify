// Build-Informationen - wird bei jedem Build aktualisiert
export const BUILD_INFO = {
  version: '1.0.0',
  buildNumber: '001',
  buildDate: new Date().toISOString(),
  gitCommit: 'dev', // Wird durch Build-Script ersetzt
  gitBranch: 'main', // Wird durch Build-Script ersetzt
  gitShortHash: 'dev', // Wird durch Build-Script ersetzt
  lastCommitDate: new Date().toISOString(),
  lastCommitMessage: 'Development build'
};

// Hilfsfunktion um Build-Info zu formatieren
export const getBuildInfoString = () => {
  return `v${BUILD_INFO.version} | Build ${BUILD_INFO.buildNumber} | ${BUILD_INFO.gitShortHash}`;
};

// Hilfsfunktion um detaillierte Build-Info zu formatieren
export const getDetailedBuildInfo = () => {
  return {
    version: BUILD_INFO.version,
    buildNumber: BUILD_INFO.buildNumber,
    buildDate: BUILD_INFO.buildDate,
    gitInfo: `${BUILD_INFO.gitBranch}/${BUILD_INFO.gitShortHash}`,
    lastCommit: BUILD_INFO.lastCommitMessage
  };
};
