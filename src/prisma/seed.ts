import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const IndonesiaUserGroup = await prisma.userGroup.upsert({
    where: { slug: 'indonesia' },
    update: { name: 'Indonesia' },
    create: { name: 'Indonesia', slug: 'indonesia' },
  });

  const MalaysiaUserGroup = await prisma.userGroup.upsert({
    where: { slug: 'malaysia' },
    update: {},
    create: { name: 'Malaysia', slug: 'malaysia' },
  });

  console.log({ IndonesiaUserGroup, MalaysiaUserGroup });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // close Prisma Client at the end
    await prisma.$disconnect();
  });
