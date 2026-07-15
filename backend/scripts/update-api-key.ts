import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const newApiKey = '0520a1468f9bb4b80aaccfb5e5266959';
  
  // ลบอันเก่าทิ้ง (ถ้าต้องการ) เพื่อไม่ให้สับสน
  try {
    await prisma.apiKey.deleteMany({
      where: { key: 'kku-public-api-key-2026' }
    });
  } catch(e) {}

  // สร้างอันใหม่ตามที่ต้องการ
  const keyRecord = await prisma.apiKey.upsert({
    where: { key: newApiKey },
    update: { isActive: true },
    create: {
      key: newApiKey,
      name: 'Master API Key',
      isActive: true,
    },
  });

  console.log('\n=============================================');
  console.log('✅ API Key ใหม่ถูกสร้างเรียบร้อยแล้ว!');
  console.log('🔑 Your NEW API Key is:', keyRecord.key);
  console.log('=============================================\n');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
