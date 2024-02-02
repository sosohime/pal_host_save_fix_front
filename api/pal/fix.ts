import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import archiver from 'archiver';

export const post = async ({
  data,
}: {
  data: {
    accounts: { old_uid: string; new_uid: string }[];
    taskName: string;
  };
}): Promise<{ error?: string; fileName: string }> => {
  const { accounts, taskName } = data;
  const errs = [];
  const saveDataFolder = path.resolve(__dirname, `../../uploads/${taskName}`);
  for (const account of accounts) {
    fs.writeFileSync(
      `./uploads/${taskName}/Players/${account.new_uid}.sav`,
      '',
    );
    const pyprog = spawnSync('python3', [
      path.resolve(__dirname, '../../scripts/fix-host-save.py'),
      '/Users/heyesheng/.cargo/bin/uesave',
      saveDataFolder,
      account.new_uid,
      account.old_uid,
    ]);

    const err = pyprog.stderr.toString('utf8');

    errs.push(err);
  }

  console.log(errs);
  const fixedZipName = `${taskName}.zip`;
  const fixedZipPath = path.resolve(__dirname, `../../fixed/${fixedZipName}`);
  if (!errs.some(e => Boolean(e))) {
    await new Promise((resolve, reject) => {
      if (fs.existsSync(fixedZipPath)) {
        fs.unlinkSync(fixedZipPath);
      }

      const output = fs.createWriteStream(fixedZipPath);
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Sets the compression level.
      });

      output.on('close', function () {
        console.log(`${archive.pointer()} total bytes`);
        console.log(
          'archiver has been finalized and the output file descriptor has closed.',
        );
        resolve(0);
      });

      // good practice to catch this error explicitly
      archive.on('error', function (err) {
        reject(err);
      });

      // pipe archive data to the file
      archive.pipe(output);

      archive.directory(saveDataFolder, false);

      archive.finalize();
    });
  }

  return {
    error: errs.join('\n'),
    fileName: fixedZipName,
  };
};
