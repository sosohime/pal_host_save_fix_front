import fs from 'node:fs';
import StreamZip from 'node-stream-zip';

const deleteFolderRecursive = function (path: string) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function (file) {
      const curPath = `${path}/${file}`;
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

export interface UploadRes {
  message: string;
  error?: string;
  data?: {
    accounts: string[];
    taskName: string;
  };
  code: number;
}
export const post = async (data: {
  formData: { file: File };
}): Promise<UploadRes> => {
  const { file } = data.formData; // 获取上传的文件对象
  // 如果非zip文件，返回错误信息
  if (!file.name.endsWith('.zip')) {
    return {
      message: '文件类型错误',
      code: 400,
    };
  }
  // 已有则先清除
  if (fs.existsSync(`./uploads/${file.name}`)) {
    fs.unlinkSync(`./uploads/${file.name}`);
  }

  const reader = fs.createReadStream(file.path); // 创建可读流
  const filePath = `./uploads/${file.name}`; // 设置文件存储路径
  const writer = fs.createWriteStream(filePath); // 创建可写流
  // 将可读流的内容写入可写流
  reader.pipe(writer);

  const res = await new Promise<Omit<UploadRes, 'code'>>(resolve => {
    reader.on('end', async () => {
      // 判断是否本地服务器存档
      try {
        // eslint-disable-next-line new-cap
        const zip = new StreamZip.async({ file: filePath });
        const zipEntries = await zip.entries();
        // 如果没有Players文件夹，返回错误信息
        if (
          !Object.values(zipEntries).some(
            entry =>
              entry.name === `${file.name.replace('.zip', '')}/Players/` &&
              entry.isDirectory,
          )
        ) {
          return resolve({
            message: '未找到Players文件夹，请使用联机存档',
          });
        }

        const zipFolder = file.name.split('.')[0];
        if (fs.existsSync(`./uploads/${zipFolder}`)) {
          deleteFolderRecursive(`./uploads/${zipFolder}`);
        }
        fs.mkdirSync(`./uploads/${zipFolder}`);

        await zip.extract(null, `./uploads`);

        const playerIds = fs.readdirSync(`./uploads/${zipFolder}/Players`);
        // 返回上传成功的消息
        return resolve({
          message: `上传成功，发现${playerIds.length}个存档`,
          data: {
            accounts: playerIds.map(p => p.replace('.sav', '')),
            taskName: zipFolder,
          },
        });
      } catch (e) {
        console.log(e);
        return resolve({
          message: `文件解析失败, ${e}`,
        });
      }
    });
  });

  fs.unlinkSync(`./uploads/${file.name}`);

  if (!res.data) {
    return {
      code: 400,
      error: res.message,
      ...res,
    };
  }

  return {
    code: 200,
    ...res,
  };
};

// export const post = async (data: { FormData: { file: File } }) => {
//   console.log(data);
//   return '666';
// };
