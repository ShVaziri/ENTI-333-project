// Script to sync project files to GitHub repository
import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

const OWNER = 'ShVaziri';
const REPO = 'ENTI-333-project';
const BRANCH = 'main';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  '.replit',
  'replit.nix',
  '.upm',
  '.cache',
  '.config',
  'package-lock.json',
  'attached_assets/generated_images',
  'attached_assets/stock_images',
  '.breakpoints',
  'generated-icon.png'
];

function shouldIgnore(filePath: string): boolean {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function getAllFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (shouldIgnore(relativePath)) continue;
    
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      files.push(relativePath);
    }
  }
  
  return files;
}

async function main() {
  console.log('Connecting to GitHub...');
  const octokit = await getGitHubClient();
  
  console.log(`Syncing to ${OWNER}/${REPO}...`);
  
  // Get the current commit SHA
  let currentSha: string | undefined;
  try {
    const { data: ref } = await octokit.git.getRef({
      owner: OWNER,
      repo: REPO,
      ref: `heads/${BRANCH}`
    });
    currentSha = ref.object.sha;
    console.log(`Current commit: ${currentSha}`);
  } catch (error: any) {
    if (error.status === 404) {
      console.log('Branch not found, will create initial commit');
    } else {
      throw error;
    }
  }
  
  // Get all files to upload
  const projectDir = process.cwd();
  const files = getAllFiles(projectDir);
  console.log(`Found ${files.length} files to sync`);
  
  // Create blobs for each file
  const tree: { path: string; mode: '100644'; type: 'blob'; sha: string }[] = [];
  
  for (const file of files) {
    const filePath = path.join(projectDir, file);
    const content = fs.readFileSync(filePath);
    const isText = !file.match(/\.(png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot)$/i);
    
    try {
      const { data: blob } = await octokit.git.createBlob({
        owner: OWNER,
        repo: REPO,
        content: isText ? content.toString('utf-8') : content.toString('base64'),
        encoding: isText ? 'utf-8' : 'base64'
      });
      
      tree.push({
        path: file,
        mode: '100644',
        type: 'blob',
        sha: blob.sha
      });
      
      console.log(`  Uploaded: ${file}`);
    } catch (error: any) {
      console.error(`  Failed: ${file} - ${error.message}`);
    }
  }
  
  // Create tree
  console.log('Creating tree...');
  const { data: newTree } = await octokit.git.createTree({
    owner: OWNER,
    repo: REPO,
    tree: tree,
    base_tree: currentSha
  });
  
  // Create commit
  console.log('Creating commit...');
  const { data: commit } = await octokit.git.createCommit({
    owner: OWNER,
    repo: REPO,
    message: 'Sync UCalgary Textbook Marketplace from Replit',
    tree: newTree.sha,
    parents: currentSha ? [currentSha] : []
  });
  
  // Update branch reference
  console.log('Updating branch...');
  if (currentSha) {
    await octokit.git.updateRef({
      owner: OWNER,
      repo: REPO,
      ref: `heads/${BRANCH}`,
      sha: commit.sha
    });
  } else {
    await octokit.git.createRef({
      owner: OWNER,
      repo: REPO,
      ref: `refs/heads/${BRANCH}`,
      sha: commit.sha
    });
  }
  
  console.log(`\nSuccess! Pushed to https://github.com/${OWNER}/${REPO}`);
  console.log(`Commit: ${commit.sha}`);
}

main().catch(console.error);
