// scripts/sign.js
const fs = require('fs');
const childProcess = require('child_process');
const path = require('path');

module.exports = async function (configuration) {
  if (parseInt(process.env.ELECTRON_BUILDER_SIGN) === 1 && configuration.path.slice(-4) === ".exe") {
    console.log(`[*] Signing file: ${configuration.path}`);

    const signToolPath = process.env.SIGNTOOL_PATH; // !!! ВАЖНО: Обновите этот путь, если он отличается !!!
    const certificatePath = path.resolve(process.env.GITHUB_WORKSPACE, process.env.SIGNING_CERT_PATH_FROM_ROOT);
    const certificatePassword = process.env.SIGNING_CERTIFICATE_PASSWORD;
    const timestampServer = 'http://timestamp.digicert.com';
    const digestAlgorithm = configuration.hash || 'sha256'; // По умолчанию используем sha256, если не указано другое

    if (!signToolPath) {
      console.error('Ошибка: Путь к signtool.exe не передан через переменную окружения SIGNTOOL_PATH.');
      process.exit(1); // Останавливаем выполнение, если нет пути
    }
    if (!certificatePassword) {
      console.error('Ошибка: Переменная окружения SIGNING_CERTIFICATE_PASSWORD не определена.');
      process.exit(1); // Останавливаем выполнение, если нет пароля
    }
    // Проверяем наличие файла сертификата
    if (!fs.existsSync(certificatePath)) {
        console.error(`Ошибка: Файл сертификата не найден по пути: ${certificatePath}`);
        process.exit(1); // Останавливаем выполнение, если нет сертификата
    }

    // Формируем команду с путем из переменной
    const signCommand = `"${signToolPath}" sign /f "${certificatePath}" /p "${certificatePassword}" /t "${timestampServer}" /fd "${digestAlgorithm}" "${configuration.path}"`;

    try {
      // Блок try...catch с улучшенным выводом ошибок оставляем как есть
      console.log(`Выполняется команда: ${signCommand}`);
      childProcess.execSync(signCommand, { stdio: 'pipe' });
      console.log(`Файл успешно подписан: ${configuration.path}`);
    } catch (error) {
        console.error(`----------------------------------------------------`);
        console.error(`ОШИБКА при подписи файла ${configuration.path}:`);
        console.error(`Команда: ${signCommand}`);
        if (error.stderr) {
          console.error("STDERR от signtool.exe:\n", error.stderr.toString());
        }
        if (error.stdout) {
          console.error("STDOUT от signtool.exe:\n", error.stdout.toString());
        }
        if (!error.stderr && !error.stdout) {
           console.error("Объект ошибки:", error);
        }
        console.error(`----------------------------------------------------`);
        process.exit(1); // Останавливаем сборку при ошибке подписи
    }
  }
};
