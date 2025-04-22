// scripts/sign.js
const childProcess = require('child_process');
const path = require('path');

module.exports = async function (configuration) {
  if (parseInt(process.env.ELECTRON_BUILDER_SIGN) === 1 && configuration.path.slice(-4) === ".exe") {
    console.log(`[*] Signing file: ${configuration.path}`);

    const signToolPath = 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.XXXX.0\\x64\\signtool.exe'; // !!! ВАЖНО: Обновите этот путь, если он отличается !!!
    const certificatePath = path.resolve(process.env.GITHUB_WORKSPACE, process.env.SIGNING_CERT_PATH_FROM_ROOT);
    const certificatePassword = process.env.SIGNING_CERTIFICATE_PASSWORD;
    const timestampServer = 'http://timestamp.digicert.com';
    const digestAlgorithm = configuration.hash || 'sha256'; // По умолчанию используем sha256, если не указано другое

    if (!certificatePassword) {
      console.error('Ошибка: Переменная окружения SIGNING_CERTIFICATE_PASSWORD не определена.');
      return;
    }

    const signCommand = `"${signToolPath}" sign /f "${certificatePath}" /p "${certificatePassword}" /t "${timestampServer}" /fd "${digestAlgorithm}" "${configuration.path}"`;

    try {
      console.log(`Выполняется команда: ${signCommand}`);
      childProcess.execSync(signCommand, { stdio: 'inherit' });
      console.log(`Файл успешно подписан: ${configuration.path}`);
    } catch (error) {
      console.error(`Ошибка при подписи файла ${configuration.path}:`, error.message);
    }
  }
};
