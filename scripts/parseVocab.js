import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.join(__dirname, '../vocab.csv');
const outPath = path.join(__dirname, '../src/data/Vocabulary.ts');

const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

const vocab = [];

// Header is expected at line 0, data starts from 1
for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(p => p.trim());
    if (parts.length >= 4 && parts[2]) {
        vocab.push({
            categoryEn: parts[0],
            categoryZh: parts[1],
            word: parts[2],
            meaning: parts[3],
            type: parts[4] || ''
        });
    }
}

const fileContent = `export interface VocabWord {
    categoryEn: string;
    categoryZh: string;
    word: string;
    meaning: string;
    type: string;
}

export const VOCABULARY: VocabWord[] = ${JSON.stringify(vocab, null, 4)};
`;

fs.writeFileSync(outPath, fileContent, 'utf8');
console.log('Successfully wrote', vocab.length, 'words to Vocabulary.ts');
