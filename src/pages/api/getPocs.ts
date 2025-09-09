import fs from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

// Define the base directory where PoCs and metadata files are stored
const baseDir = path.join(process.cwd(), 'src/app/pocs');

function getPocsData() {
  const categories = fs.readdirSync(baseDir).filter((category) => {
    return fs.lstatSync(path.join(baseDir, category)).isDirectory();
  });

  const pocs = categories.flatMap((category) => {
    const categoryPath = path.join(baseDir, category);
    const subdirs = fs.readdirSync(categoryPath);

    return subdirs
      .map((subdir) => {
        const metadataPath = path.join(categoryPath, subdir, 'metadata.json');
        if (fs.existsSync(metadataPath)) {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
          return {
            path: `/pocs/${category}/${subdir}`,
            metadata,
          };
        }
        return null;
      })
      .filter(Boolean);
  });

  return pocs;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const pocs = getPocsData();
  res.status(200).json(pocs);
}
