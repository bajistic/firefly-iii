module.exports = {
  apps: [
    {
      name: 'jarvis',
      script: 'npm',
      args: 'start',
      cwd: '/', // Working directory
      watch: ['/src'], // Directories/files to watch
      ignore_watch: ['node_modules', 'logs', '*.log'], // Files/directories to ignore
    },
  ],
};
