const path = require('path');
const { app } = require('electron');
const fs = require('fs');

let prisma;

function getPrisma() {
  if (!prisma) {
    // In production (packaged app), we need to specify the database location and query engine
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    
    let datasourceUrl;
    
    if (isDev) {
      // In development, use the default location
      datasourceUrl = `file:${path.join(__dirname, '..', 'prisma', 'main.db')}`;
    } else {
      // In production, store database in userData directory
      const userDataPath = app.getPath('userData');
      datasourceUrl = `file:${path.join(userDataPath, 'main.db')}`;

      // Set the Prisma query engine path for packaged app
      // When unpacked from ASAR, files are in app.asar.unpacked
      let basePath = __dirname;
      if (basePath.includes('app.asar')) {
        basePath = basePath.replace('app.asar', 'app.asar.unpacked');
      }

      const prismaPath = path.join(basePath, '..', 'prisma-client');
      const queryEnginePath = path.join(prismaPath, 'query_engine-windows.dll.node');

      console.log('[Prisma] Base path:', basePath);
      console.log('[Prisma] Prisma client path:', prismaPath);
      console.log('[Prisma] Query engine path:', queryEnginePath);
      console.log('[Prisma] Query engine exists:', fs.existsSync(queryEnginePath));

      // Set environment variable for query engine location
      process.env.PRISMA_QUERY_ENGINE_LIBRARY = queryEnginePath;
    }

    // Require from the correct location
    let PrismaClient;
    if (!isDev) {
      let basePath = __dirname;
      if (basePath.includes('app.asar')) {
        basePath = basePath.replace('app.asar', 'app.asar.unpacked');
      }
      const prismaClientPath = path.join(basePath, '..', 'prisma-client');
      console.log('[Prisma] Loading client from:', prismaClientPath);
      PrismaClient = require(prismaClientPath).PrismaClient;
    } else {
      PrismaClient = require('../prisma-client').PrismaClient;
    }
    
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: datasourceUrl
        }
      },
      log: ['error', 'warn']
    });
    
    console.log('[Prisma] Initialized with database URL:', datasourceUrl);
  }
  return prisma;
}

async function disconnectPrisma() {
  if (prisma) {
    try {
      await prisma.$disconnect();
      console.log('[Prisma] Disconnected successfully');
      prisma = null;
    } catch (error) {
      console.error('[Prisma] Error during disconnect:', error);
    }
  }
}

module.exports = { getPrisma, disconnectPrisma };

