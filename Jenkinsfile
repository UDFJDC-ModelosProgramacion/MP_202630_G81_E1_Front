pipeline {
  agent any
  tools { nodejs 'node20' }
  stages {
    stage('Install') { steps { sh 'npm ci' } }
    stage('Unit tests + coverage') { steps { sh 'npm run test:unit' } }
    stage('E2E tests') {
      steps {
        sh 'npx playwright install --with-deps chromium'
        sh 'npm run test:e2e'
      }
    }
    stage('SonarQube') {
      steps {
        withSonarQubeEnv('sonar') { sh 'npx sonar-scanner' }
      }
    }
    stage('Build') { steps { sh 'npm run build' } }
  }
}
