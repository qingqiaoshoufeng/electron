import fs from 'fs';
import archiver from 'archiver';

function compressFolder(folderPath:string, filePath:string) {
  const output = fs.createWriteStream(filePath);
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      resolve(`${filePath}`);
    });

    archive.on('error', (err:any) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(folderPath, false);
    archive.finalize();
  });
}

async function compressFolderSync(folderPath:string, filePath:string) {
  return await compressFolder(folderPath,filePath)
}


export  { compressFolder, compressFolderSync };
