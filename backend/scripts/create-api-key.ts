import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const apiKey = 'kku-public-api-key-2026';
  
  const keyRecord = await prisma.apiKey.upsert({
    where: { key: apiKey },
    update: {},
    create: {
      key: apiKey,
      name: 'Default Public API Key',
      isActive: true,
    },
  });

  console.log('\n=============================================');
  console.log('✅ API Key created successfully!');
  console.log('🔑 Your API Key is:', keyRecord.key);
  console.log('=============================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Failed to connect to database or create key.');
    console.error(e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
